import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { JwtPayload } from './jwt';

export interface AuthContext {
  userId: string;
  email: string;
  tenantId?: string;
  tenantRole?: Role;
}

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
      tenant?: TenantContext;
    }
  }
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}

export function param(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export function toAuthContext(payload: JwtPayload): AuthContext {
  return {
    userId: payload.userId,
    email: payload.email,
    tenantId: payload.tenantId,
    tenantRole: payload.tenantRole,
  };
}
