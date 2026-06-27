import { Router, Request } from 'express';
import { createDocumentSchema } from '@hoa/shared';
import { prisma } from '../lib/prisma';
import { asyncHandler, AppError, param } from '../lib/types';
import { optionalAuth, requireAuth, requireTenantMembership, requireTenantRole } from '../middleware/auth';
import { resolveTenant, requireTenant } from '../middleware/tenant';
import { Role } from '@prisma/client';

const router = Router({ mergeParams: true });

router.use(resolveTenant, requireTenant);

function visibilityFilter(role?: Role) {
  if (role && ['SUPER_ADMIN', 'BOARD', 'MANAGER'].includes(role)) {
    return {};
  }
  if (role && ['MEMBER', 'RESIDENT'].includes(role)) {
    return { visibility: { in: ['PUBLIC' as const, 'MEMBERS' as const] } };
  }
  return { visibility: 'PUBLIC' as const };
}

async function resolveTenantRole(req: Request, tenantId: string): Promise<Role | undefined> {
  if (!req.auth?.userId) {
    return undefined;
  }

  const tenantUser = await prisma.tenantUser.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId: req.auth.userId,
      },
    },
    select: { role: true, status: true },
  });

  if (!tenantUser || tenantUser.status !== 'ACTIVE') {
    return undefined;
  }

  return tenantUser.role;
}

router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const tenantId = req.tenant!.tenantId;
    const role = await resolveTenantRole(req, tenantId);

    const docs = await prisma.document.findMany({
      where: {
        tenantId,
        ...visibilityFilter(role),
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ documents: docs });
  }),
);

router.post(
  '/',
  requireAuth,
  requireTenantMembership,
  requireTenantRole(['SUPER_ADMIN', 'BOARD']),
  asyncHandler(async (req, res) => {
    const data = createDocumentSchema.parse(req.body);
    const doc = await prisma.document.create({
      data: {
        tenantId: req.tenant!.tenantId,
        uploadedById: req.auth!.userId,
        ...data,
      },
    });
    res.status(201).json({ document: doc });
  }),
);

router.delete(
  '/:id',
  requireAuth,
  requireTenantMembership,
  requireTenantRole(['SUPER_ADMIN', 'BOARD']),
  asyncHandler(async (req, res) => {
    const result = await prisma.document.deleteMany({
      where: { id: param(req.params.id), tenantId: req.tenant!.tenantId },
    });
    if (result.count === 0) throw new AppError(404, 'Document not found');
    res.json({ success: true });
  }),
);

export default router;
