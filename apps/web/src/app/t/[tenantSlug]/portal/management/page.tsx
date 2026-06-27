'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PortalShell } from '@/components/layout/portal-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { HOA_MANAGEMENT_EMAIL, HOA_MANAGEMENT_NAME } from '@/lib/site-info';

export default function PortalManagementPage() {
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
        <h1 className="text-2xl font-bold sm:text-3xl">HOA Management</h1>
        <p className="mt-1 text-sm text-gray-500">Community management contacts and information.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{tenant?.name ?? 'Your Community'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-gray-700">
          <div>
            <p className="font-medium text-gray-900">Management company</p>
            <p className="mt-1">{HOA_MANAGEMENT_NAME}</p>
            <a href={`mailto:${HOA_MANAGEMENT_EMAIL}`} className="mt-1 inline-block text-blue-600 hover:underline">
              {HOA_MANAGEMENT_EMAIL}
            </a>
          </div>

          {tenant?.primaryContactEmail && (
            <div>
              <p className="font-medium text-gray-900">Community contact</p>
              <a
                href={`mailto:${tenant.primaryContactEmail}`}
                className="mt-1 inline-block text-blue-600 hover:underline"
              >
                {tenant.primaryContactEmail}
              </a>
            </div>
          )}

          {tenant?.address && (
            <div>
              <p className="font-medium text-gray-900">Community address</p>
              <p className="mt-1">
                {tenant.address}
                {tenant.state ? `, ${tenant.state}` : ''}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </PortalShell>
  );
}
