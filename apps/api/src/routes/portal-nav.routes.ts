import { Router } from 'express';
import { mergePortalNavConfig, updatePortalNavConfigSchema } from '@hoa/shared';
import { prisma } from '../lib/prisma';
import { parsePortalNavConfig } from '../lib/portal-nav';
import { asyncHandler, AppError } from '../lib/types';
import { requireAuth, requireTenantMembership, requireTenantRole } from '../middleware/auth';
import { resolveTenant, requireTenant } from '../middleware/tenant';

const router = Router({ mergeParams: true });

router.use(resolveTenant, requireTenant);

router.get(
  '/',
  requireAuth,
  requireTenantMembership,
  asyncHandler(async (req, res) => {
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: req.tenant!.tenantId },
      select: { portalNavConfig: true },
    });

    res.json({ portalNav: parsePortalNavConfig(settings?.portalNavConfig) });
  }),
);

router.patch(
  '/',
  requireAuth,
  requireTenantMembership,
  requireTenantRole(['SUPER_ADMIN', 'BOARD']),
  asyncHandler(async (req, res) => {
    const updates = updatePortalNavConfigSchema.parse(req.body);
    const existing = await prisma.tenantSettings.findUnique({
      where: { tenantId: req.tenant!.tenantId },
      select: { portalNavConfig: true },
    });

    if (!existing) {
      throw new AppError(404, 'Tenant settings not found');
    }

    const portalNav = mergePortalNavConfig({
      ...parsePortalNavConfig(existing.portalNavConfig),
      ...updates,
    });

    await prisma.tenantSettings.update({
      where: { tenantId: req.tenant!.tenantId },
      data: { portalNavConfig: portalNav },
    });

    res.json({ portalNav });
  }),
);

export default router;
