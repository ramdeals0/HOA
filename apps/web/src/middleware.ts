import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  getLoginRedirectUrl,
  getSessionCookieName,
  isProtectedPath,
  requiresTenantSelection,
} from '@/lib/auth-routes';
import { readJwtPayload } from '@/lib/session-token';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const session = request.cookies.get(getSessionCookieName())?.value;
  if (!session) {
    return NextResponse.redirect(getLoginRedirectUrl(request.url, pathname));
  }

  if (requiresTenantSelection(pathname)) {
    const payload = readJwtPayload(session);
    if (!payload?.tenantId) {
      const selectUrl = new URL('/select-community', request.url);
      selectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(selectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/select-community',
    '/saas-admin',
    '/saas-admin/:path*',
    '/t/:tenantSlug/portal',
    '/t/:tenantSlug/portal/:path*',
    '/t/:tenantSlug/admin',
    '/t/:tenantSlug/admin/:path*',
  ],
};
