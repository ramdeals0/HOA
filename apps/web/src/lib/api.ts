const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
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

  const res = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    credentials: 'include',
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
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
