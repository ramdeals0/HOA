import { Router } from 'express';
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
    const payments = await paymentService.getMyPayments(req.tenant!.tenantId, req.auth!.userId);
    res.json({ payments });
  }),
);

export { tenantRouter as paymentsTenantRouter };
export default router;
