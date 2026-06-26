import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler, param } from '../lib/types';
import { requireAuth, requireTenantMembership, requireTenantRole } from '../middleware/auth';
import { resolveTenant, requireTenant } from '../middleware/tenant';

const router = Router({ mergeParams: true });

router.use(resolveTenant, requireTenant);

router.get(
  '/',
  requireAuth,
  requireTenantMembership,
  requireTenantRole(['SUPER_ADMIN', 'BOARD', 'MANAGER']),
  asyncHandler(async (req, res) => {
    const search = req.query.search as string | undefined;
    const members = await prisma.tenantUser.findMany({
      where: {
        tenantId: req.tenant!.tenantId,
        status: 'ACTIVE',
        ...(search
          ? {
              user: {
                OR: [
                  { firstName: { contains: search, mode: 'insensitive' } },
                  { lastName: { contains: search, mode: 'insensitive' } },
                  { email: { contains: search, mode: 'insensitive' } },
                ],
              },
            }
          : {}),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    res.json({
      members: members.map((m) => ({
        id: m.user.id,
        role: m.role,
        status: m.status,
        firstName: m.user.firstName,
        lastName: m.user.lastName,
        email: m.user.email,
        phone: m.user.phone,
      })),
    });
  }),
);

router.get(
  '/:id',
  requireAuth,
  requireTenantMembership,
  requireTenantRole(['SUPER_ADMIN', 'BOARD', 'MANAGER']),
  asyncHandler(async (req, res) => {
    const member = await prisma.tenantUser.findFirst({
      where: { tenantId: req.tenant!.tenantId, userId: param(req.params.id) },
      include: {
        user: true,
      },
    });

    if (!member) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    const properties = await prisma.property.findMany({
      where: { tenantId: req.tenant!.tenantId, ownerId: param(req.params.id) },
    });

    res.json({
      member: {
        id: member.user.id,
        role: member.role,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
        email: member.user.email,
        phone: member.user.phone,
        properties,
      },
    });
  }),
);

export default router;
