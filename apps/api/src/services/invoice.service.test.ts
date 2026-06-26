const mockFindMany = jest.fn();
const mockCreate = jest.fn();
const mockTransaction = jest.fn();

jest.mock('../lib/prisma', () => ({
  prisma: {
    tenantUser: { findMany: mockFindMany },
    invoice: { create: mockCreate },
    $transaction: mockTransaction,
    tenant: { findUnique: jest.fn() },
  },
}));

import { InvoiceService } from './invoice.service';

describe('InvoiceService', () => {
  let service: InvoiceService;

  beforeEach(() => {
    service = new InvoiceService();
    jest.clearAllMocks();
  });

  it('generates invoices for all active members', async () => {
    const { prisma } = require('../lib/prisma');

    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant-1',
      settings: { monthlyDuesCents: 15000 },
    });

    prisma.tenantUser.findMany.mockResolvedValue([
      { userId: 'user-1' },
      { userId: 'user-2' },
    ]);

    const mockInvoices = [{ id: 'inv-1' }, { id: 'inv-2' }];
    prisma.$transaction.mockResolvedValue(mockInvoices);

    const result = await service.generateForAllMembers({
      tenantId: 'tenant-1',
      periodStart: new Date('2025-01-01'),
      periodEnd: new Date('2025-01-31'),
      dueDate: new Date('2025-02-15'),
    });

    expect(result).toHaveLength(2);
    expect(prisma.tenantUser.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-1' }) }),
    );
  });
});
