import { Router } from 'express';
import { generateInvoicesSchema, paymentHistoryQuerySchema, updateTenantSchema } from '@hoa/shared';
import { asyncHandler, AppError } from '../lib/types';
import { requireAuth, requireTenantMembership, requireTenantRole } from '../middleware/auth';
import { resolveTenant, requireTenant } from '../middleware/tenant';
import { invoiceService } from '../services/invoice.service';
import { PaymentService } from '../services/payment.service';
import { createEmailService } from '../services/email.service';
import { TenantService } from '../services/auth.service';

const router = Router({ mergeParams: true });
const tenantService = new TenantService();
const paymentService = new PaymentService(createEmailService());

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
      amountCents: data.amountCents,
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
    const query = paymentHistoryQuerySchema.parse(req.query);
    const from = query.from ? new Date(`${query.from}T00:00:00.000Z`) : undefined;
    const to = query.to ? new Date(`${query.to}T23:59:59.999Z`) : undefined;

    const [openInvoices, payments, paidInvoices] = await Promise.all([
      invoiceService.getMyInvoices(req.tenant!.tenantId, req.auth!.userId, {
        statuses: ['OPEN', 'OVERDUE'],
      }),
      paymentService.getMyPayments(req.tenant!.tenantId, req.auth!.userId, { from, to }),
      invoiceService.getMyInvoices(req.tenant!.tenantId, req.auth!.userId, {
        statuses: ['PAID'],
        from,
        to,
      }),
    ]);

    res.json({
      invoices: openInvoices,
      payments,
      paidInvoices,
      filters: { from: query.from ?? null, to: query.to ?? null },
    });
  }),
);

export default router;
