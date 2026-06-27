import { Router } from 'express';
import { createNewsSchema, updateNewsSchema } from '@hoa/shared';
import { prisma } from '../lib/prisma';
import { contentCreatedWithinRetention } from '../lib/content-retention';
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
      ['SUPER_ADMIN', 'BOARD', 'MANAGER'].includes(req.auth.tenantRole ?? '');

    const posts = await prisma.newsPost.findMany({
      where: {
        tenantId,
        ...contentCreatedWithinRetention(),
        ...(isStaff ? {} : { isPublic: true, isPublished: true }),
      },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { firstName: true, lastName: true } } },
    });

    res.json({ posts });
  }),
);

router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const post = await prisma.newsPost.findFirst({
      where: {
        id: param(req.params.id),
        tenantId: req.tenant!.tenantId,
        ...contentCreatedWithinRetention(),
      },
      include: { author: { select: { firstName: true, lastName: true } } },
    });

    if (!post) throw new AppError(404, 'Post not found');

    const isStaff = req.auth?.tenantId === req.tenant!.tenantId &&
      ['SUPER_ADMIN', 'BOARD', 'MANAGER'].includes(req.auth.tenantRole ?? '');

    if (!isStaff && (!post.isPublic || !post.isPublished)) {
      throw new AppError(404, 'Post not found');
    }

    res.json({ post });
  }),
);

router.post(
  '/',
  requireAuth,
  requireTenantMembership,
  requireTenantRole(['SUPER_ADMIN', 'BOARD']),
  asyncHandler(async (req, res) => {
    const data = createNewsSchema.parse(req.body);
    const post = await prisma.newsPost.create({
      data: {
        tenantId: req.tenant!.tenantId,
        authorId: req.auth!.userId,
        ...data,
      },
    });
    res.status(201).json({ post });
  }),
);

router.patch(
  '/:id',
  requireAuth,
  requireTenantMembership,
  requireTenantRole(['SUPER_ADMIN', 'BOARD']),
  asyncHandler(async (req, res) => {
    const data = updateNewsSchema.parse(req.body);
    const post = await prisma.newsPost.updateMany({
      where: {
        id: param(req.params.id),
        tenantId: req.tenant!.tenantId,
        ...contentCreatedWithinRetention(),
      },
      data,
    });
    if (post.count === 0) throw new AppError(404, 'Post not found');
    const updated = await prisma.newsPost.findUnique({ where: { id: param(req.params.id) } });
    res.json({ post: updated });
  }),
);

router.delete(
  '/:id',
  requireAuth,
  requireTenantMembership,
  requireTenantRole(['SUPER_ADMIN', 'BOARD']),
  asyncHandler(async (req, res) => {
    const result = await prisma.newsPost.deleteMany({
      where: {
        id: param(req.params.id),
        tenantId: req.tenant!.tenantId,
        ...contentCreatedWithinRetention(),
      },
    });
    if (result.count === 0) throw new AppError(404, 'Post not found');
    res.json({ success: true });
  }),
);

export default router;
