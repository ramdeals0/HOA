import { Router } from 'express';
import {
  castVoteSchema,
  createResolutionSchema,
  resolutionQuerySchema,
  updateResolutionSchema,
} from '@hoa/shared';
import { asyncHandler, param } from '../lib/types';
import { requireAuth, requireTenantMembership, requireTenantRole } from '../middleware/auth';
import { resolveTenant, requireTenant } from '../middleware/tenant';
import { canManageResolutions, resolutionService } from '../services/resolution.service';

const router = Router({ mergeParams: true });

router.use(resolveTenant, requireTenant);

router.get(
  '/',
  requireAuth,
  requireTenantMembership,
  asyncHandler(async (req, res) => {
    const query = resolutionQuerySchema.parse(req.query);
    const isBoard = canManageResolutions(req.auth!.tenantRole);
    const resolutions = await resolutionService.listResolutions(
      req.tenant!.tenantId,
      {
        status: query.status,
        type: query.type,
      },
      isBoard,
    );

    res.json({
      resolutions: resolutions.map((resolution) =>
        resolutionService.formatResolution(resolution, req.auth!.userId, isBoard),
      ),
    });
  }),
);

router.get(
  '/:id',
  requireAuth,
  requireTenantMembership,
  asyncHandler(async (req, res) => {
    const isBoard = canManageResolutions(req.auth!.tenantRole);
    const resolution = await resolutionService.getResolution(req.tenant!.tenantId, param(req.params.id));

    if (resolution.status === 'DRAFT' && !isBoard) {
      res.status(404).json({ error: 'Resolution not found' });
      return;
    }

    res.json({
      resolution: resolutionService.formatResolution(resolution, req.auth!.userId, isBoard),
    });
  }),
);

router.post(
  '/',
  requireAuth,
  requireTenantMembership,
  requireTenantRole(['SUPER_ADMIN', 'BOARD']),
  asyncHandler(async (req, res) => {
    const data = createResolutionSchema.parse(req.body);
    const resolution = await resolutionService.createResolution(
      req.tenant!.tenantId,
      req.auth!.userId,
      {
        title: data.title,
        description: data.description,
        type: data.type,
        opensAt: data.opensAt ? new Date(data.opensAt) : undefined,
        closesAt: data.closesAt ? new Date(data.closesAt) : undefined,
        options: data.options,
      },
    );

    res.status(201).json({
      resolution: resolutionService.formatResolution(resolution, req.auth!.userId, true),
    });
  }),
);

router.patch(
  '/:id',
  requireAuth,
  requireTenantMembership,
  requireTenantRole(['SUPER_ADMIN', 'BOARD']),
  asyncHandler(async (req, res) => {
    const data = updateResolutionSchema.parse(req.body);
    const resolution = await resolutionService.updateResolution(req.tenant!.tenantId, param(req.params.id), {
      title: data.title,
      description: data.description,
      type: data.type,
      opensAt: data.opensAt === undefined ? undefined : data.opensAt ? new Date(data.opensAt) : null,
      closesAt: data.closesAt === undefined ? undefined : data.closesAt ? new Date(data.closesAt) : null,
      options: data.options,
    });

    res.json({
      resolution: resolutionService.formatResolution(resolution, req.auth!.userId, true),
    });
  }),
);

router.patch(
  '/:id/open',
  requireAuth,
  requireTenantMembership,
  requireTenantRole(['SUPER_ADMIN', 'BOARD']),
  asyncHandler(async (req, res) => {
    const resolution = await resolutionService.setStatus(req.tenant!.tenantId, param(req.params.id), 'OPEN');
    res.json({
      resolution: resolutionService.formatResolution(resolution, req.auth!.userId, true),
    });
  }),
);

router.patch(
  '/:id/close',
  requireAuth,
  requireTenantMembership,
  requireTenantRole(['SUPER_ADMIN', 'BOARD']),
  asyncHandler(async (req, res) => {
    const resolution = await resolutionService.setStatus(req.tenant!.tenantId, param(req.params.id), 'CLOSED');
    res.json({
      resolution: resolutionService.formatResolution(resolution, req.auth!.userId, true),
    });
  }),
);

router.post(
  '/:id/vote',
  requireAuth,
  requireTenantMembership,
  asyncHandler(async (req, res) => {
    const data = castVoteSchema.parse(req.body);
    const vote = await resolutionService.castVote(
      req.tenant!.tenantId,
      param(req.params.id),
      req.auth!.userId,
      data.optionId,
    );
    const resolution = await resolutionService.getResolution(req.tenant!.tenantId, param(req.params.id));
    const isBoard = canManageResolutions(req.auth!.tenantRole);

    res.json({
      vote,
      resolution: resolutionService.formatResolution(resolution, req.auth!.userId, isBoard),
    });
  }),
);

export default router;
