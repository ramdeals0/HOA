'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PortalShell } from '@/components/layout/portal-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { HOA_MANAGEMENT_EMAIL, HOA_MANAGEMENT_NAME } from '@/lib/site-info';

export default function PortalContactPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ currentTenant: { role: string } | null }>('/api/auth/me'),
  });

  const { data: tenant } = useQuery({
    queryKey: ['tenant', slug],
    queryFn: () =>
      api<{
        name: string;
        primaryContactEmail: string;
        address?: string | null;
        state?: string | null;
      }>(`/api/tenants/${slug}`),
  });

  return (
    <PortalShell slug={slug} role={me?.currentTenant?.role}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Contact Us</h1>
        <p className="mt-1 text-sm text-gray-500">Reach your HOA board and management team.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>HOA Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <p>{HOA_MANAGEMENT_NAME}</p>
            <a href={`mailto:${HOA_MANAGEMENT_EMAIL}`} className="block text-blue-600 hover:underline">
              {HOA_MANAGEMENT_EMAIL}
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tenant?.name ?? 'Community Board'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            {tenant?.primaryContactEmail ? (
              <a
                href={`mailto:${tenant.primaryContactEmail}`}
                className="block text-blue-600 hover:underline"
              >
                {tenant.primaryContactEmail}
              </a>
            ) : (
              <p className="text-gray-500">Community contact email not configured.</p>
            )}
            {tenant?.address && (
              <p className="pt-2 text-gray-600">
                {tenant.address}
                {tenant.state ? `, ${tenant.state}` : ''}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalShell>
  );
}
