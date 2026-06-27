import { prisma } from '../lib/prisma';
import type {
  CollectionsSummary,
  DelinquencyRow,
  InvoiceExportRow,
  MemberExportRow,
  MembersSummary,
  PaymentExportRow,
} from '@hoa/shared';

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function getPrimaryPropertiesByOwner(tenantId: string, ownerIds: string[]) {
  if (ownerIds.length === 0) {
    return new Map<string, { street: string; lotNumber: string | null }>();
  }

  const properties = await prisma.property.findMany({
    where: {
      tenantId,
      ownerId: { in: ownerIds },
      isActive: true,
    },
    orderBy: { street: 'asc' },
  });

  const propertyByOwner = new Map<string, { street: string; lotNumber: string | null }>();
  for (const property of properties) {
    if (property.ownerId && !propertyByOwner.has(property.ownerId)) {
      propertyByOwner.set(property.ownerId, {
        street: property.street,
        lotNumber: property.lotNumber,
      });
    }
  }

  return propertyByOwner;
}

export class ReportingService {
  async getCollectionsSummary(tenantId: string, from: Date, to: Date): Promise<CollectionsSummary> {
    const [invoices, payments] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          tenantId,
          dueDate: { gte: from, lte: to },
          status: { not: 'VOID' },
        },
        select: {
          amountCents: true,
          status: true,
          dueDate: true,
        },
      }),
      prisma.payment.findMany({
        where: {
          tenantId,
          createdAt: { gte: from, lte: to },
          status: 'SUCCEEDED',
        },
        select: {
          amountCents: true,
          createdAt: true,
        },
      }),
    ]);

    const invoicedCents = invoices.reduce((sum, invoice) => sum + invoice.amountCents, 0);
    const paidInvoiceCents = invoices
      .filter((invoice) => invoice.status === 'PAID')
      .reduce((sum, invoice) => sum + invoice.amountCents, 0);
    const paidPaymentCents = payments.reduce((sum, payment) => sum + payment.amountCents, 0);
    const paidCents = Math.max(paidInvoiceCents, paidPaymentCents);
    const overdueCents = invoices
      .filter((invoice) => invoice.status === 'OVERDUE' || invoice.status === 'OPEN')
      .reduce((sum, invoice) => sum + invoice.amountCents, 0);
    const collectionRate = invoicedCents > 0 ? Math.round((paidCents / invoicedCents) * 1000) / 10 : 0;

    const monthlyMap = new Map<string, { invoicedCents: number; paidCents: number }>();

    for (const invoice of invoices) {
      const key = monthKey(invoice.dueDate);
      const current = monthlyMap.get(key) ?? { invoicedCents: 0, paidCents: 0 };
      current.invoicedCents += invoice.amountCents;
      if (invoice.status === 'PAID') {
        current.paidCents += invoice.amountCents;
      }
      monthlyMap.set(key, current);
    }

    for (const payment of payments) {
      const key = monthKey(payment.createdAt);
      const current = monthlyMap.get(key) ?? { invoicedCents: 0, paidCents: 0 };
      current.paidCents += payment.amountCents;
      monthlyMap.set(key, current);
    }

    const monthly = [...monthlyMap.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([month, values]) => ({ month, ...values }));

    return {
      totals: {
        invoicedCents,
        paidCents,
        overdueCents,
        collectionRate,
      },
      monthly,
    };
  }

  async getInvoicesForExport(tenantId: string, from: Date, to: Date): Promise<InvoiceExportRow[]> {
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        dueDate: { gte: from, lte: to },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const propertyByOwner = await getPrimaryPropertiesByOwner(
      tenantId,
      invoices.map((invoice) => invoice.userId),
    );

    return invoices.map((invoice) => {
      const property = propertyByOwner.get(invoice.userId);
      return {
        tenantId: invoice.tenantId,
        invoiceId: invoice.id,
        memberName: `${invoice.user.firstName} ${invoice.user.lastName}`.trim(),
        memberEmail: invoice.user.email,
        propertyStreet: property?.street ?? '',
        propertyLot: property?.lotNumber ?? '',
        description: invoice.description,
        amountCents: invoice.amountCents,
        status: invoice.status,
        dueDate: formatDateOnly(invoice.dueDate),
        periodStart: formatDateOnly(invoice.periodStart),
        periodEnd: formatDateOnly(invoice.periodEnd),
      };
    });
  }

  async getPaymentsForExport(tenantId: string, from: Date, to: Date): Promise<PaymentExportRow[]> {
    const payments = await prisma.payment.findMany({
      where: {
        tenantId,
        createdAt: { gte: from, lte: to },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        invoice: {
          select: {
            description: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return payments.map((payment) => ({
      tenantId: payment.tenantId,
      paymentId: payment.id,
      memberName: `${payment.user.firstName} ${payment.user.lastName}`.trim(),
      memberEmail: payment.user.email,
      invoiceDescription: payment.invoice.description,
      amountCents: payment.amountCents,
      status: payment.status,
      paidAt: payment.createdAt.toISOString(),
    }));
  }

  async getMembersForExport(tenantId: string): Promise<MemberExportRow[]> {
    const members = await prisma.tenantUser.findMany({
      where: { tenantId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [{ user: { lastName: 'asc' } }, { user: { firstName: 'asc' } }],
    });

    const propertyByOwner = await getPrimaryPropertiesByOwner(
      tenantId,
      members.map((member) => member.userId),
    );

    return members.map((member) => {
      const property = propertyByOwner.get(member.userId);
      return {
        tenantId: member.tenantId,
        memberId: member.user.id,
        memberName: `${member.user.firstName} ${member.user.lastName}`.trim(),
        memberEmail: member.user.email,
        role: member.role,
        status: member.status,
        joinDate: formatDateOnly(member.createdAt),
        lastLogin: 'Not tracked',
        propertyStreet: property?.street ?? '',
        propertyLot: property?.lotNumber ?? '',
      };
    });
  }

  async getMembersSummary(tenantId: string): Promise<MembersSummary> {
    const [totalMembers, activeMembers, pendingMembers, pendingApplications] = await Promise.all([
      prisma.tenantUser.count({ where: { tenantId } }),
      prisma.tenantUser.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.tenantUser.count({
        where: { tenantId, status: { in: ['INVITED', 'SUSPENDED'] } },
      }),
      prisma.membershipApplication.count({
        where: { tenantId, status: 'PENDING' },
      }),
    ]);

    return {
      totalMembers,
      activeMembers,
      pendingMembers,
      pendingApplications,
    };
  }

  async getDelinquencies(tenantId: string): Promise<DelinquencyRow[]> {
    const now = new Date();
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: { in: ['OPEN', 'OVERDUE'] },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const propertyByOwner = await getPrimaryPropertiesByOwner(
      tenantId,
      invoices.map((invoice) => invoice.userId),
    );

    return invoices.map((invoice) => {
      const property = propertyByOwner.get(invoice.userId);
      const daysPastDue = Math.max(
        0,
        Math.floor((now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)),
      );

      return {
        invoiceId: invoice.id,
        memberName: `${invoice.user.firstName} ${invoice.user.lastName}`.trim(),
        memberEmail: invoice.user.email,
        propertyStreet: property?.street ?? '',
        propertyLot: property?.lotNumber ?? '',
        amountCents: invoice.amountCents,
        status: invoice.status,
        dueDate: formatDateOnly(invoice.dueDate),
        daysPastDue,
      };
    });
  }
}

export const reportingService = new ReportingService();

export const REPORTS_ALLOWED_ROLES = ['SUPER_ADMIN', 'BOARD'] as const;

export function canAccessReports(role?: string): boolean {
  return REPORTS_ALLOWED_ROLES.includes(role as (typeof REPORTS_ALLOWED_ROLES)[number]);
}
