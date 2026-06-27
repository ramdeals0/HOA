import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getLoginRedirectUrl, getSessionCookieName, isProtectedPath } from '@/lib/auth-routes';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const session = request.cookies.get(getSessionCookieName())?.value;
  if (!session) {
    return NextResponse.redirect(getLoginRedirectUrl(request.url, pathname));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/saas-admin',
    '/saas-admin/:path*',
    '/t/:tenantSlug/portal',
    '/t/:tenantSlug/portal/:path*',
    '/t/:tenantSlug/admin',
    '/t/:tenantSlug/admin/:path*',
  ],
};
