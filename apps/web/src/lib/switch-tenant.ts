import { api } from '@/lib/api';
import { tenantPortalPath } from '@/lib/session-token';

export async function switchTenantSession(
  tenantId: string,
  slug: string,
  redirectPath?: string | null,
) {
  await api('/api/auth/select-tenant', {
    method: 'POST',
    body: JSON.stringify({ tenantId }),
  });
  window.location.assign(tenantPortalPath(slug, redirectPath));
}
