import { Router } from 'express';
import { generateInvoicesSchema, updateTenantSchema } from '@hoa/shared';
import { asyncHandler, AppError } from '../lib/types';
import { requireAuth, requireTenantMembership, requireTenantRole } from '../middleware/auth';
import { resolveTenant, requireTenant } from '../middleware/tenant';
import { invoiceService } from '../services/invoice.service';
import { TenantService } from '../services/auth.service';
import { prisma } from '../lib/prisma';

const router = Router({ mergeParams: true });
const tenantService = new TenantService();

router.use(resolveTenant, requireTenant);

router.get(
  '/my',
  requireAuth,
  requireTenantMembership,
  asyncHandler(async (req, res) => {
    const invoices = await invoiceService.getMyInvoices(req.tenant!.tenantId, req.auth!.userId);
    res.json({ invoices });
  }),
);

router.get(
  '/',
  requireAuth,
  requireTenantMembership,
  requireTenantRole(['SUPER_ADMIN', 'BOARD', 'MANAGER']),
  asyncHandler(async (req, res) => {
    const invoices = await invoiceService.getTenantInvoices(req.tenant!.tenantId);
    const metrics = await invoiceService.getCollectionMetrics(req.tenant!.tenantId);
    res.json({ invoices, metrics });
  }),
);

router.post(
  '/generate',
  requireAuth,
  requireTenantMembership,
  requireTenantRole(['SUPER_ADMIN', 'BOARD']),
  asyncHandler(async (req, res) => {
    const data = generateInvoicesSchema.parse(req.body);
    const invoices = await invoiceService.generateForAllMembers({
      tenantId: req.tenant!.tenantId,
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd),
      dueDate: new Date(data.dueDate),
      description: data.description,
    });
    res.status(201).json({ invoices, count: invoices.length });
  }),
);

router.patch(
  '/settings/dues',
  requireAuth,
  requireTenantMembership,
  requireTenantRole(['SUPER_ADMIN', 'BOARD']),
  asyncHandler(async (req, res) => {
    const data = updateTenantSchema.parse(req.body);
    const tenant = await tenantService.updateSettings(req.tenant!.tenantId, data);
    res.json({ tenant });
  }),
);

router.get(
  '/statements/my',
  requireAuth,
  requireTenantMembership,
  asyncHandler(async (req, res) => {
    const [invoices, payments] = await Promise.all([
      invoiceService.getMyInvoices(req.tenant!.tenantId, req.auth!.userId),
      prisma.payment.findMany({
        where: { tenantId: req.tenant!.tenantId, userId: req.auth!.userId },
        orderBy: { createdAt: 'desc' },
        include: { invoice: true },
      }),
    ]);
    res.json({ invoices, payments });
  }),
);

export default router;
