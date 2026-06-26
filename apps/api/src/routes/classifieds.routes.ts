import { Router } from 'express';
import { createClassifiedSchema, updateClassifiedSchema } from '@hoa/shared';
import { prisma } from '../lib/prisma';
import { asyncHandler, AppError, param } from '../lib/types';
import { optionalAuth, requireAuth, requireTenantMembership, requireTenantRole } from '../middleware/auth';
import { resolveTenant, requireTenant } from '../middleware/tenant';

const router = Router({ mergeParams: true });

router.use(resolveTenant, requireTenant);

router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const tenantId = req.tenant!.tenantId;
    const isStaff = req.auth?.tenantId === tenantId &&
      ['SUPER_ADMIN', 'BOARD'].includes(req.auth.tenantRole ?? '');

    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;

    const listings = await prisma.classifiedListing.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(isStaff && req.query.status
          ? { status: req.query.status as 'PENDING' | 'APPROVED' | 'REJECTED' }
          : isStaff && req.query.all === 'true'
            ? {}
            : { status: 'APPROVED' }),
        ...(category ? { category } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { firstName: true, lastName: true } } },
    });

    res.json({ listings });
  }),
);

router.post(
  '/',
  requireAuth,
  requireTenantMembership,
  asyncHandler(async (req, res) => {
    const data = createClassifiedSchema.parse(req.body);
    const listing = await prisma.classifiedListing.create({
      data: {
        tenantId: req.tenant!.tenantId,
        authorId: req.auth!.userId,
        ...data,
        status: 'PENDING',
      },
    });
    res.status(201).json({ listing });
  }),
);

router.patch(
  '/:id',
  requireAuth,
  requireTenantMembership,
  asyncHandler(async (req, res) => {
    const listing = await prisma.classifiedListing.findFirst({
      where: { id: param(req.params.id), tenantId: req.tenant!.tenantId, deletedAt: null },
    });
    if (!listing) throw new AppError(404, 'Listing not found');

    const isOwner = listing.authorId === req.auth!.userId;
    const isBoard = ['SUPER_ADMIN', 'BOARD'].includes(req.auth!.tenantRole ?? '');

    if (!isOwner && !isBoard) throw new AppError(403, 'Forbidden');

    const data = updateClassifiedSchema.parse(req.body);
    const updated = await prisma.classifiedListing.update({
      where: { id: param(req.params.id) },
      data: isOwner && !isBoard ? { ...data, status: 'PENDING' } : data,
    });
    res.json({ listing: updated });
  }),
);

router.patch(
  '/:id/approve',
  requireAuth,
  requireTenantMembership,
  requireTenantRole(['SUPER_ADMIN', 'BOARD']),
  asyncHandler(async (req, res) => {
    const listing = await prisma.classifiedListing.updateMany({
      where: { id: param(req.params.id), tenantId: req.tenant!.tenantId },
      data: { status: 'APPROVED', reviewedById: req.auth!.userId, reviewedAt: new Date() },
    });
    if (listing.count === 0) throw new AppError(404, 'Listing not found');
    const updated = await prisma.classifiedListing.findUnique({ where: { id: param(req.params.id) } });
    res.json({ listing: updated });
  }),
);

router.patch(
  '/:id/reject',
  requireAuth,
  requireTenantMembership,
  requireTenantRole(['SUPER_ADMIN', 'BOARD']),
  asyncHandler(async (req, res) => {
    const listing = await prisma.classifiedListing.updateMany({
      where: { id: param(req.params.id), tenantId: req.tenant!.tenantId },
      data: { status: 'REJECTED', reviewedById: req.auth!.userId, reviewedAt: new Date() },
    });
    if (listing.count === 0) throw new AppError(404, 'Listing not found');
    const updated = await prisma.classifiedListing.findUnique({ where: { id: param(req.params.id) } });
    res.json({ listing: updated });
  }),
);

router.delete(
  '/:id',
  requireAuth,
  requireTenantMembership,
  asyncHandler(async (req, res) => {
    const listing = await prisma.classifiedListing.findFirst({
      where: { id: param(req.params.id), tenantId: req.tenant!.tenantId },
    });
    if (!listing) throw new AppError(404, 'Listing not found');

    const isOwner = listing.authorId === req.auth!.userId;
    const isBoard = ['SUPER_ADMIN', 'BOARD'].includes(req.auth!.tenantRole ?? '');
    if (!isOwner && !isBoard) throw new AppError(403, 'Forbidden');

    await prisma.classifiedListing.update({
      where: { id: param(req.params.id) },
      data: { deletedAt: new Date() },
    });
    res.json({ success: true });
  }),
);

export default router;
