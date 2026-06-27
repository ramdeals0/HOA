import { Router } from 'express';
import { paymentHistoryQuerySchema } from '@hoa/shared';
import { asyncHandler } from '../lib/types';
import { requireAuth, requireTenantMembership } from '../middleware/auth';
import { resolveTenant, requireTenant } from '../middleware/tenant';
import { PaymentService } from '../services/payment.service';
import { createEmailService } from '../services/email.service';

const router = Router();
const paymentService = new PaymentService(createEmailService());

router.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    const signature = req.headers['stripe-signature'] as string;
    await paymentService.handleWebhook(req.body as Buffer, signature);
    res.json({ received: true });
  }),
);

const tenantRouter = Router({ mergeParams: true });
tenantRouter.use(resolveTenant, requireTenant);

tenantRouter.post(
  '/checkout-session',
  requireAuth,
  requireTenantMembership,
  asyncHandler(async (req, res) => {
    const { invoiceId } = req.body;
    const session = await paymentService.createCheckoutSession(
      req.tenant!.tenantId,
      req.auth!.userId,
      invoiceId,
    );
    res.json(session);
  }),
);

tenantRouter.get(
  '/my',
  requireAuth,
  requireTenantMembership,
  asyncHandler(async (req, res) => {
    const query = paymentHistoryQuerySchema.parse(req.query);
    const from = query.from ? new Date(`${query.from}T00:00:00.000Z`) : undefined;
    const to = query.to ? new Date(`${query.to}T23:59:59.999Z`) : undefined;
    const payments = await paymentService.getMyPayments(req.tenant!.tenantId, req.auth!.userId, {
      from,
      to,
    });
    res.json({ payments, filters: { from: query.from ?? null, to: query.to ?? null } });
  }),
);

export { tenantRouter as paymentsTenantRouter };
export default router;
