const mockInvoiceFindMany = jest.fn();
const mockPaymentFindMany = jest.fn();
const mockTenantUserFindMany = jest.fn();
const mockPropertyFindMany = jest.fn();
const mockTenantUserCount = jest.fn();
const mockMembershipApplicationCount = jest.fn();

jest.mock('../lib/prisma', () => ({
  prisma: {
    invoice: { findMany: mockInvoiceFindMany },
    payment: { findMany: mockPaymentFindMany },
    tenantUser: { findMany: mockTenantUserFindMany, count: mockTenantUserCount },
    property: { findMany: mockPropertyFindMany },
    membershipApplication: { count: mockMembershipApplicationCount },
  },
}));

import { rowsToCsv } from '../lib/csv';
import {
  ReportingService,
  canAccessReports,
  REPORTS_ALLOWED_ROLES,
} from './reporting.service';

describe('canAccessReports', () => {
  it('allows only board and super admin roles', () => {
    expect(canAccessReports('BOARD')).toBe(true);
    expect(canAccessReports('SUPER_ADMIN')).toBe(true);
    expect(canAccessReports('MANAGER')).toBe(false);
    expect(canAccessReports('MEMBER')).toBe(false);
    expect(canAccessReports(undefined)).toBe(false);
  });

  it('documents the allowed roles used by report routes', () => {
    expect(REPORTS_ALLOWED_ROLES).toEqual(['SUPER_ADMIN', 'BOARD']);
  });
});

describe('ReportingService export tenant scoping', () => {
  let service: ReportingService;

  beforeEach(() => {
    service = new ReportingService();
    jest.clearAllMocks();
    mockPropertyFindMany.mockResolvedValue([]);
  });

  it('scopes invoice export queries to the requested tenant', async () => {
    mockInvoiceFindMany.mockResolvedValue([
      {
        tenantId: 'tenant-a',
        id: 'inv-1',
        userId: 'user-1',
        description: 'Annual dues',
        amountCents: 5000,
        status: 'PAID',
        dueDate: new Date('2026-01-01T00:00:00.000Z'),
        periodStart: new Date('2026-01-01T00:00:00.000Z'),
        periodEnd: new Date('2026-12-31T23:59:59.999Z'),
        user: {
          id: 'user-1',
          firstName: 'Jane',
          lastName: 'Member',
          email: 'jane@example.com',
        },
      },
    ]);

    const rows = await service.getInvoicesForExport(
      'tenant-a',
      new Date('2026-01-01T00:00:00.000Z'),
      new Date('2026-12-31T23:59:59.999Z'),
    );

    expect(mockInvoiceFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-a' }),
      }),
    );
    expect(rows.every((row) => row.tenantId === 'tenant-a')).toBe(true);
  });

  it('scopes payment export queries to the requested tenant', async () => {
    mockPaymentFindMany.mockResolvedValue([
      {
        tenantId: 'tenant-b',
        id: 'pay-1',
        amountCents: 5000,
        status: 'SUCCEEDED',
        createdAt: new Date('2026-01-01T12:00:00.000Z'),
        user: {
          firstName: 'John',
          lastName: 'Member',
          email: 'john@example.com',
        },
        invoice: { description: 'Annual dues' },
      },
    ]);

    const rows = await service.getPaymentsForExport(
      'tenant-b',
      new Date('2026-01-01T00:00:00.000Z'),
      new Date('2026-12-31T23:59:59.999Z'),
    );

    expect(mockPaymentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-b' }),
      }),
    );
    expect(rows.every((row) => row.tenantId === 'tenant-b')).toBe(true);
  });

  it('generates CSV rows that only include the matching tenant_id', async () => {
    mockInvoiceFindMany.mockResolvedValue([
      {
        tenantId: 'tenant-a',
        id: 'inv-1',
        userId: 'user-1',
        description: 'Annual dues',
        amountCents: 5000,
        status: 'PAID',
        dueDate: new Date('2026-01-01T00:00:00.000Z'),
        periodStart: new Date('2026-01-01T00:00:00.000Z'),
        periodEnd: new Date('2026-12-31T23:59:59.999Z'),
        user: {
          id: 'user-1',
          firstName: 'Jane',
          lastName: 'Member',
          email: 'jane@example.com',
        },
      },
      {
        tenantId: 'tenant-a',
        id: 'inv-2',
        userId: 'user-2',
        description: 'Annual dues',
        amountCents: 5000,
        status: 'OPEN',
        dueDate: new Date('2026-02-01T00:00:00.000Z'),
        periodStart: new Date('2026-01-01T00:00:00.000Z'),
        periodEnd: new Date('2026-12-31T23:59:59.999Z'),
        user: {
          id: 'user-2',
          firstName: 'John',
          lastName: 'Member',
          email: 'john@example.com',
        },
      },
    ]);

    const rows = await service.getInvoicesForExport(
      'tenant-a',
      new Date('2026-01-01T00:00:00.000Z'),
      new Date('2026-12-31T23:59:59.999Z'),
    );

    const csv = rowsToCsv(rows, [
      { key: 'tenantId', header: 'tenant_id' },
      { key: 'invoiceId', header: 'invoice_id' },
      { key: 'memberName', header: 'member_name' },
    ]);

    expect(csv).toContain('tenant_id,invoice_id,member_name');
    expect(csv).not.toContain('tenant-b');
    expect(csv.split('\n').slice(1).every((line) => line.startsWith('tenant-a,'))).toBe(true);
  });
});
