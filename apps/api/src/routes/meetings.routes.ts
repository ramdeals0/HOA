import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/types';
import { optionalAuth, requireAuth, requireTenantMembership } from '../middleware/auth';
import { resolveTenant, requireTenant } from '../middleware/tenant';

const router = Router({ mergeParams: true });

router.use(resolveTenant, requireTenant);

router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const tenantId = req.tenant!.tenantId;
    const year = Number(req.query.year) || new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);

    const isMember =
      req.auth?.tenantId === tenantId &&
      ['SUPER_ADMIN', 'BOARD', 'MANAGER', 'MEMBER', 'RESIDENT'].includes(req.auth.tenantRole ?? '');

    if (!isMember) {
      res.json({ meetings: [], year });
      return;
    }

    const meetings = await prisma.communityMeeting.findMany({
      where: {
        tenantId,
        scheduledAt: { gte: start, lt: end },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    res.json({ meetings, year });
  }),
);

export default router;
