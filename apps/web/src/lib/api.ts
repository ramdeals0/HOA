function getApiBaseUrl() {
  // Browser requests go through the Next.js /api rewrite so auth cookies stay same-origin.
  if (typeof window !== 'undefined') {
    return '';
  }

  return (
    process.env.API_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:4000'
  );
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function redirectToLogin() {
  if (typeof window === 'undefined') {
    return;
  }

  const redirect = `${window.location.pathname}${window.location.search}`;
  const loginUrl = new URL('/login', window.location.origin);
  loginUrl.searchParams.set('redirect', redirect);
  window.location.assign(loginUrl.toString());
}

export async function api<T>(
  path: string,
  options: RequestInit & { tenantSlug?: string } = {},
): Promise<T> {
  const { tenantSlug, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (tenantSlug) {
    headers['x-tenant-slug'] = tenantSlug;
  }

  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...fetchOptions,
    credentials: 'include',
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && path !== '/api/auth/login' && path !== '/api/auth/logout') {
      redirectToLogin();
    }
    throw new ApiError(res.status, data.error ?? 'Request failed');
  }

  return data as T;
}

export function tenantApi<T>(tenantSlug: string, path: string, options?: RequestInit) {
  return api<T>(`/api/t/${tenantSlug}${path}`, { ...options, tenantSlug });
}

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export async function downloadTenantCsv(
  tenantSlug: string,
  path: string,
  filename: string,
): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/api/t/${tenantSlug}${path}`, {
    credentials: 'include',
    headers: {
      'x-tenant-slug': tenantSlug,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data.error ?? 'Download failed');
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
