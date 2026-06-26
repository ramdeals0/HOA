import { Router } from 'express';
import { createApplicationSchema } from '@hoa/shared';
import { asyncHandler, param } from '../lib/types';
import { optionalAuth, requireAuth, requireTenantMembership, requireTenantRole } from '../middleware/auth';
import { resolveTenant, requireTenant } from '../middleware/tenant';
import { ApplicationService } from '../services/auth.service';
import { createEmailService } from '../services/email.service';

const router = Router({ mergeParams: true });
const applicationService = new ApplicationService(createEmailService());

router.use(resolveTenant, requireTenant);

router.post(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const data = createApplicationSchema.parse(req.body);
    const app = await applicationService.create(
      req.tenant!.tenantId,
      data,
      req.auth?.userId,
    );
    res.status(201).json({ application: app });
  }),
);

router.get(
  '/',
  requireAuth,
  requireTenantMembership,
  requireTenantRole(['SUPER_ADMIN', 'BOARD']),
  asyncHandler(async (req, res) => {
    const status = req.query.status as string | undefined;
    const apps = await applicationService.list(req.tenant!.tenantId, status);
    res.json({ applications: apps });
  }),
);

router.patch(
  '/:id/approve',
  requireAuth,
  requireTenantMembership,
  requireTenantRole(['SUPER_ADMIN', 'BOARD']),
  asyncHandler(async (req, res) => {
    const app = await applicationService.approve(
      req.tenant!.tenantId,
      param(req.params.id),
      req.auth!.userId,
    );
    res.json({ application: app });
  }),
);

router.patch(
  '/:id/reject',
  requireAuth,
  requireTenantMembership,
  requireTenantRole(['SUPER_ADMIN', 'BOARD']),
  asyncHandler(async (req, res) => {
    const app = await applicationService.reject(
      req.tenant!.tenantId,
      param(req.params.id),
      req.auth!.userId,
    );
    res.json({ application: app });
  }),
);

export default router;
