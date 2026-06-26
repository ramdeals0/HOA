import { Router } from 'express';
import { asyncHandler } from '../lib/types';
import { requireAuth, requireTenantMembership } from '../middleware/auth';
import { resolveTenant, requireTenant } from '../middleware/tenant';
import { directoryService } from '../services/directory.service';

const router = Router({ mergeParams: true });

router.use(resolveTenant, requireTenant);

router.get(
  '/',
  requireAuth,
  requireTenantMembership,
  asyncHandler(async (req, res) => {
    const residents = await directoryService.getDirectory(req.tenant!.tenantId);
    res.json({ residents });
  }),
);

export default router;
