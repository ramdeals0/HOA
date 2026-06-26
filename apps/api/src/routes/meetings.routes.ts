import { Router } from 'express';
import { createMeetingSchema, meetingQuerySchema, updateMeetingSchema } from '@hoa/shared';
import { prisma } from '../lib/prisma';
import { asyncHandler, AppError, param } from '../lib/types';
import { optionalAuth, requireAuth, requireTenantMembership, requireTenantRole } from '../middleware/auth';
import { resolveTenant, requireTenant } from '../middleware/tenant';

const router = Router({ mergeParams: true });

router.use(resolveTenant, requireTenant);

function isTenantMember(req: { auth?: { tenantId?: string; tenantRole?: string } }, tenantId: string) {
  return (
    req.auth?.tenantId === tenantId &&
    ['SUPER_ADMIN', 'BOARD', 'MANAGER', 'MEMBER', 'RESIDENT'].includes(req.auth.tenantRole ?? '')
  );
}

function parseDateRange(query: { year?: number; from?: string; to?: string }) {
  if (query.from && query.to) {
    return {
      start: new Date(`${query.from}T00:00:00.000Z`),
      end: new Date(`${query.to}T23:59:59.999Z`),
      year: query.year ?? new Date(query.from).getFullYear(),
    };
  }

  const year = query.year ?? new Date().getFullYear();
  return {
    start: new Date(year, 0, 1),
    end: new Date(year + 1, 0, 1),
    year,
  };
}

router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const tenantId = req.tenant!.tenantId;
    const query = meetingQuerySchema.parse(req.query);
    const { start, end, year } = parseDateRange(query);

    if (!isTenantMember(req, tenantId)) {
      res.json({ meetings: [], year, filters: { from: query.from ?? null, to: query.to ?? null } });
      return;
    }

    const dateFilter =
      query.from && query.to
        ? { gte: start, lte: end }
        : { gte: start, lt: end };

    const meetings = await prisma.communityMeeting.findMany({
      where: {
        tenantId,
        scheduledAt: dateFilter,
      },
      orderBy: { scheduledAt: 'asc' },
    });

    res.json({
      meetings,
      year,
      filters: { from: query.from ?? null, to: query.to ?? null },
    });
  }),
);

router.post(
  '/',
  requireAuth,
  requireTenantMembership,
  requireTenantRole(['SUPER_ADMIN', 'BOARD']),
  asyncHandler(async (req, res) => {
    const data = createMeetingSchema.parse(req.body);
    const meeting = await prisma.communityMeeting.create({
      data: {
        tenantId: req.tenant!.tenantId,
        title: data.title,
        scheduledAt: new Date(data.scheduledAt),
        location: data.location,
        description: data.description,
        meetingType: data.meetingType,
      },
    });
    res.status(201).json({ meeting });
  }),
);

router.patch(
  '/:id',
  requireAuth,
  requireTenantMembership,
  requireTenantRole(['SUPER_ADMIN', 'BOARD']),
  asyncHandler(async (req, res) => {
    const data = updateMeetingSchema.parse(req.body);
    const { scheduledAt, ...rest } = data;
    const result = await prisma.communityMeeting.updateMany({
      where: { id: param(req.params.id), tenantId: req.tenant!.tenantId },
      data: {
        ...rest,
        ...(scheduledAt ? { scheduledAt: new Date(scheduledAt) } : {}),
      },
    });
    if (result.count === 0) throw new AppError(404, 'Event not found');
    const meeting = await prisma.communityMeeting.findUnique({ where: { id: param(req.params.id) } });
    res.json({ meeting });
  }),
);

router.delete(
  '/:id',
  requireAuth,
  requireTenantMembership,
  requireTenantRole(['SUPER_ADMIN', 'BOARD']),
  asyncHandler(async (req, res) => {
    const result = await prisma.communityMeeting.deleteMany({
      where: { id: param(req.params.id), tenantId: req.tenant!.tenantId },
    });
    if (result.count === 0) throw new AppError(404, 'Event not found');
    res.json({ success: true });
  }),
);

export default router;
