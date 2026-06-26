import { Router } from 'express';
import { Plan } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { asyncHandler, param } from '../lib/types';
import { requireAuth, requirePlatformOwner } from '../middleware/auth';

const router = Router();

router.use(requireAuth, requirePlatformOwner);

router.get(
  '/tenants',
  asyncHandler(async (_req, res) => {
    const tenants = await prisma.tenant.findMany({
      include: {
        settings: { select: { lastStripeEventAt: true, lastEmailSentAt: true } },
        _count: { select: { properties: true, tenantUsers: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const enriched = await Promise.all(
      tenants.map(async (t) => {
        const arBalance = await prisma.invoice.aggregate({
          where: { tenantId: t.id, status: { in: ['OPEN', 'OVERDUE'] } },
          _sum: { amountCents: true },
        });

        const lastActivity = await prisma.tenantUser.findFirst({
          where: { tenantId: t.id },
          orderBy: { updatedAt: 'desc' },
        });

        return {
          id: t.id,
          name: t.name,
          slug: t.slug,
          plan: t.plan,
          isActive: t.isActive,
          propertyCount: t._count.properties,
          memberCount: t._count.tenantUsers,
          arBalanceCents: arBalance._sum.amountCents ?? 0,
          lastActiveAt: lastActivity?.updatedAt ?? t.updatedAt,
          lastStripeEventAt: t.settings?.lastStripeEventAt,
          lastEmailSentAt: t.settings?.lastEmailSentAt,
        };
      }),
    );

    res.json({ tenants: enriched });
  }),
);

router.patch(
  '/tenants/:id',
  asyncHandler(async (req, res) => {
    const { plan, isActive } = req.body;
    const tenant = await prisma.tenant.update({
      where: { id: param(req.params.id) },
      data: {
        ...(plan ? { plan: plan as Plan } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });
    res.json({ tenant });
  }),
);

export default router;
