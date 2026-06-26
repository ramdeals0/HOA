import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/types';
import { requireAuth, requireTenantMembership } from '../middleware/auth';
import { resolveTenant, requireTenant } from '../middleware/tenant';

const router = Router({ mergeParams: true });

router.use(resolveTenant, requireTenant);

const updateAccountSchema = z.object({
  phone: z.string().optional().nullable(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

router.get(
  '/',
  requireAuth,
  requireTenantMembership,
  asyncHandler(async (req, res) => {
    const userId = req.auth!.userId;
    const tenantId = req.tenant!.tenantId;

    const [user, properties, tenantUser] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      }),
      prisma.property.findMany({
        where: { tenantId, ownerId: userId, isActive: true },
        orderBy: { street: 'asc' },
      }),
      prisma.tenantUser.findUnique({
        where: { tenantId_userId: { tenantId, userId } },
        select: { role: true, status: true },
      }),
    ]);

    res.json({
      user,
      properties,
      membership: tenantUser,
    });
  }),
);

router.patch(
  '/',
  requireAuth,
  requireTenantMembership,
  asyncHandler(async (req, res) => {
    const data = updateAccountSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.auth!.userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    });
    res.json({ user });
  }),
);

export default router;
