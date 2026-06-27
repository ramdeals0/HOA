export function readJwtPayload(token: string): {
  userId?: string;
  email?: string;
  tenantId?: string;
  tenantRole?: string;
} | null {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(padded)) as {
      userId?: string;
      email?: string;
      tenantId?: string;
      tenantRole?: string;
    };
  } catch {
    return null;
  }
}

export function tenantPortalPath(slug: string, redirectPath?: string | null) {
  const fallback = `/t/${slug}/portal`;
  if (!redirectPath || !redirectPath.startsWith(`/t/${slug}/`)) {
    return fallback;
  }
  return redirectPath;
}
