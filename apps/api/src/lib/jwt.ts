import jwt, { SignOptions } from 'jsonwebtoken';
import { Role } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  tenantId?: string;
  tenantRole?: Role;
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d';
export const COOKIE_NAME = process.env.COOKIE_NAME ?? 'hoa_session';

export function signToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  const crossOrigin = process.env.COOKIE_CROSS_ORIGIN === 'true' || isProd;
  return {
    httpOnly: true,
    secure: crossOrigin,
    sameSite: (crossOrigin ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}
