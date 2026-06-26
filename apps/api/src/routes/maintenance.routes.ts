import { Router } from 'express';
import { createMaintenanceSchema, updateMaintenanceSchema } from '@hoa/shared';
import { prisma } from '../lib/prisma';
import { asyncHandler, AppError, param } from '../lib/types';
import { requireAuth, requireTenantMembership, requireTenantRole } from '../middleware/auth';
import { resolveTenant, requireTenant } from '../middleware/tenant';
import { featureFlagService } from '../services/feature-flag.service';

const router = Router({ mergeParams: true });

router.use(resolveTenant, requireTenant);

router.post(
  '/',
  requireAuth,
  requireTenantMembership,
  asyncHandler(async (req, res) => {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenant!.tenantId } });
    if (!tenant || !featureFlagService.canUseMaintenance(tenant.plan)) {
      throw new AppError(403, 'Maintenance module requires PRO or ENTERPRISE plan', 'PLAN_LIMIT');
    }

    const data = createMaintenanceSchema.parse(req.body);
    const request = await prisma.maintenanceRequest.create({
      data: {
        tenantId: req.tenant!.tenantId,
        requesterId: req.auth!.userId,
        ...data,
      },
    });
    res.status(201).json({ request });
  }),
);

router.get(
  '/my',
  requireAuth,
  requireTenantMembership,
  asyncHandler(async (req, res) => {
    const requests = await prisma.maintenanceRequest.findMany({
      where: { tenantId: req.tenant!.tenantId, requesterId: req.auth!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ requests });
  }),
);

router.get(
  '/',
  requireAuth,
  requireTenantMembership,
  requireTenantRole(['SUPER_ADMIN', 'BOARD', 'MANAGER']),
  asyncHandler(async (req, res) => {
    const requests = await prisma.maintenanceRequest.findMany({
      where: { tenantId: req.tenant!.tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        requester: { select: { firstName: true, lastName: true, email: true } },
        property: true,
      },
    });
    res.json({ requests });
  }),
);

router.patch(
  '/:id',
  requireAuth,
  requireTenantMembership,
  requireTenantRole(['SUPER_ADMIN', 'BOARD', 'MANAGER']),
  asyncHandler(async (req, res) => {
    const data = updateMaintenanceSchema.parse(req.body);
    const result = await prisma.maintenanceRequest.updateMany({
      where: { id: param(req.params.id), tenantId: req.tenant!.tenantId },
      data,
    });
    if (result.count === 0) throw new AppError(404, 'Request not found');
    const updated = await prisma.maintenanceRequest.findUnique({ where: { id: param(req.params.id) } });
    res.json({ request: updated });
  }),
);

export default router;
