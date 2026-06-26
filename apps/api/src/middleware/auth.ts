import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { verifyToken, COOKIE_NAME } from '../lib/jwt';
import { AppError, toAuthContext } from '../lib/types';
import { prisma } from '../lib/prisma';

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[COOKIE_NAME] ?? req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const payload = verifyToken(token);
      req.auth = toAuthContext(payload);
    }
    next();
  } catch {
    next();
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[COOKIE_NAME] ?? req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new AppError(401, 'Authentication required', 'AUTH_REQUIRED');
    }
    const payload = verifyToken(token);
    req.auth = toAuthContext(payload);
    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
    } else {
      next(new AppError(401, 'Invalid or expired token', 'AUTH_INVALID'));
    }
  }
}

export async function requireTenantMembership(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.auth?.userId) {
      throw new AppError(401, 'Authentication required', 'AUTH_REQUIRED');
    }
    if (!req.tenant?.tenantId) {
      throw new AppError(400, 'Tenant context required', 'TENANT_REQUIRED');
    }

    const tenantUser = await prisma.tenantUser.findUnique({
      where: {
        tenantId_userId: {
          tenantId: req.tenant.tenantId,
          userId: req.auth.userId,
        },
      },
    });

    if (!tenantUser || tenantUser.status !== 'ACTIVE') {
      throw new AppError(403, 'Not a member of this community', 'TENANT_ACCESS_DENIED');
    }

    req.auth.tenantId = req.tenant.tenantId;
    req.auth.tenantRole = tenantUser.role;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireTenantRole(allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth?.tenantRole || !allowedRoles.includes(req.auth.tenantRole)) {
      next(new AppError(403, 'Insufficient permissions', 'FORBIDDEN'));
      return;
    }
    next();
  };
}

export function requirePlatformOwner(req: Request, _res: Response, next: NextFunction) {
  prisma.user
    .findUnique({ where: { id: req.auth!.userId } })
    .then((user) => {
      if (!user?.isPlatformOwner) {
        next(new AppError(403, 'Platform owner access required', 'FORBIDDEN'));
        return;
      }
      next();
    })
    .catch(next);
}
