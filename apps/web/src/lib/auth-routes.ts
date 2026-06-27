const COOKIE_NAME = process.env.COOKIE_NAME ?? 'hoa_session';

export function getSessionCookieName() {
  return COOKIE_NAME;
}

export function isProtectedPath(pathname: string) {
  if (pathname === '/saas-admin' || pathname.startsWith('/saas-admin/')) {
    return true;
  }

  return /^\/t\/[^/]+\/(portal|admin)(\/.*)?$/.test(pathname);
}

export function getLoginRedirectUrl(requestUrl: string, pathname: string) {
  const loginUrl = new URL('/login', requestUrl);
  loginUrl.searchParams.set('redirect', pathname);
  return loginUrl;
}

export function getSafeRedirectPath(path: string | null | undefined) {
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return null;
  }
  return path;
}
