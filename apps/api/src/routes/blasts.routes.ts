import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createBlastSchema } from '@hoa/shared';
import { asyncHandler, AppError } from '../lib/types';
import { requireAuth, requireTenantMembership, requireTenantRole } from '../middleware/auth';
import { resolveTenant, requireTenant } from '../middleware/tenant';
import { BlastService } from '../services/auth.service';
import { createEmailService } from '../services/email.service';
import { featureFlagService } from '../services/feature-flag.service';
import { prisma } from '../lib/prisma';

const router = Router({ mergeParams: true });
const blastService = new BlastService(createEmailService());

const blastLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many blast messages' },
});

router.use(resolveTenant, requireTenant);

router.get(
  '/',
  requireAuth,
  requireTenantMembership,
  requireTenantRole(['SUPER_ADMIN', 'BOARD']),
  asyncHandler(async (req, res) => {
    const blasts = await blastService.list(req.tenant!.tenantId);
    res.json({ blasts });
  }),
);

router.post(
  '/',
  blastLimiter,
  requireAuth,
  requireTenantMembership,
  requireTenantRole(['SUPER_ADMIN', 'BOARD']),
  asyncHandler(async (req, res) => {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenant!.tenantId } });
    if (!tenant || !featureFlagService.canSendBlasts(tenant.plan)) {
      throw new AppError(403, 'Blast messaging requires PRO or ENTERPRISE plan', 'PLAN_LIMIT');
    }

    const data = createBlastSchema.parse(req.body);
    const blast = await blastService.create(
      req.tenant!.tenantId,
      req.auth!.userId,
      data,
      req.auth!.email,
    );
    res.status(201).json({ blast });
  }),
);

export default router;
