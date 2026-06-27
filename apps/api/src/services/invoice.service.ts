import { prisma } from '../lib/prisma';
import { AppError } from '../lib/types';
import { featureFlagService } from './feature-flag.service';

export interface GenerateInvoicesParams {
  tenantId: string;
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
  description?: string;
  amountCents?: number;
}

export class InvoiceService {
  async generateForAllMembers(params: GenerateInvoicesParams) {
    const { tenantId, periodStart, periodEnd, dueDate, description, amountCents } = params;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { settings: true },
    });

    if (!tenant?.settings) {
      throw new AppError(404, 'Tenant settings not found');
    }

    const members = await prisma.tenantUser.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        role: { in: ['MEMBER', 'BOARD', 'RESIDENT'] },
      },
      select: { userId: true },
    });

    const invoiceAmountCents = amountCents ?? tenant.settings.monthlyDuesCents;
    const desc =
      description ??
      `HOA Dues ${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`;

    const invoices = await prisma.$transaction(
      members.map((m) =>
        prisma.invoice.create({
          data: {
            tenantId,
            userId: m.userId,
            amountCents: invoiceAmountCents,
            description: desc,
            periodStart,
            periodEnd,
            dueDate,
            status: 'OPEN',
          },
        }),
      ),
    );

    return invoices;
  }

  async getMyInvoices(
    tenantId: string,
    userId: string,
    filters?: { from?: Date; to?: Date; statuses?: Array<'OPEN' | 'OVERDUE' | 'PAID' | 'DRAFT' | 'VOID'> },
  ) {
    const where: {
      tenantId: string;
      userId: string;
      status?: { in: Array<'OPEN' | 'OVERDUE' | 'PAID' | 'DRAFT' | 'VOID'> };
      dueDate?: { gte?: Date; lte?: Date };
    } = { tenantId, userId };

    if (filters?.statuses?.length) {
      where.status = { in: filters.statuses };
    }

    if (filters?.from || filters?.to) {
      where.dueDate = {};
      if (filters.from) {
        where.dueDate.gte = filters.from;
      }
      if (filters.to) {
        where.dueDate.lte = filters.to;
      }
    }

    return prisma.invoice.findMany({
      where,
      orderBy: { dueDate: 'desc' },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
  }

  async getTenantInvoices(tenantId: string) {
    return prisma.invoice.findMany({
      where: { tenantId },
      orderBy: { dueDate: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        payments: true,
      },
    });
  }

  async getCollectionMetrics(tenantId: string) {
    const [paid, unpaid, overdue] = await Promise.all([
      prisma.invoice.aggregate({
        where: { tenantId, status: 'PAID' },
        _sum: { amountCents: true },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: { tenantId, status: 'OPEN' },
        _sum: { amountCents: true },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: { tenantId, status: 'OVERDUE' },
        _sum: { amountCents: true },
        _count: true,
      }),
    ]);

    return {
      paid: { count: paid._count, totalCents: paid._sum.amountCents ?? 0 },
      unpaid: { count: unpaid._count, totalCents: unpaid._sum.amountCents ?? 0 },
      overdue: { count: overdue._count, totalCents: overdue._sum.amountCents ?? 0 },
    };
  }
}

export const invoiceService = new InvoiceService();

export { featureFlagService };
