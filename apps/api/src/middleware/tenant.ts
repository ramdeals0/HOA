import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/types';

export async function resolveTenant(req: Request, _res: Response, next: NextFunction) {
  try {
    const slug =
      (req.params.tenantSlug as string | undefined) ??
      (req.headers['x-tenant-slug'] as string | undefined);

    if (!slug) {
      throw new AppError(400, 'Tenant slug is required', 'TENANT_REQUIRED');
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: { settings: true },
    });

    if (!tenant) {
      throw new AppError(404, 'Community not found', 'TENANT_NOT_FOUND');
    }

    if (!tenant.isActive) {
      throw new AppError(403, 'Community is inactive', 'TENANT_INACTIVE');
    }

    req.tenant = { tenantId: tenant.id, tenantSlug: tenant.slug };
    next();
  } catch (err) {
    next(err);
  }
}

export function requireTenant(req: Request, _res: Response, next: NextFunction) {
  if (!req.tenant?.tenantId) {
    next(new AppError(400, 'Tenant context required', 'TENANT_REQUIRED'));
    return;
  }
  next();
}
