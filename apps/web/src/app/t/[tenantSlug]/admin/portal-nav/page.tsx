'use client';

import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PortalNav } from '@/components/layout/portal-nav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  PORTAL_OPTIONAL_NAV_KEYS,
  PORTAL_OPTIONAL_NAV_LABELS,
  type PortalOptionalNavConfig,
} from '@hoa/shared';
import { api, tenantApi } from '@/lib/api';

export default function AdminPortalNavPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;
  const qc = useQueryClient();

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ currentTenant: { role: string } | null }>('/api/auth/me'),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['portal-nav', slug],
    queryFn: () => tenantApi<{ portalNav: PortalOptionalNavConfig }>(slug, '/portal-nav'),
  });

  const portalNav = data?.portalNav;

  async function toggleFeature(key: keyof PortalOptionalNavConfig) {
    if (!portalNav) {
      return;
    }

    await tenantApi(slug, '/portal-nav', {
      method: 'PATCH',
      body: JSON.stringify({ [key]: !portalNav[key] }),
    });
    qc.invalidateQueries({ queryKey: ['portal-nav', slug] });
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-white p-4">
        <PortalNav slug={slug} role={me?.currentTenant?.role} />
      </aside>
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold">Portal Navigation</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          HOA members always see Home, My Account, HOA Payment, HOA Maintenance, HOA Management,
          HOA Covenants, and Contact Us. Enable additional tabs below for members to see in the
          sidebar.
        </p>

        <Card className="mt-6 max-w-2xl">
          <CardHeader>
            <CardTitle>Optional member tabs</CardTitle>
            <CardDescription>Board members always see all tabs plus admin tools.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && <p className="text-sm text-gray-500">Loading navigation settings...</p>}
            {portalNav &&
              PORTAL_OPTIONAL_NAV_KEYS.map((key) => (
                <label
                  key={key}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <span className="text-sm font-medium">{PORTAL_OPTIONAL_NAV_LABELS[key]}</span>
                  <input
                    type="checkbox"
                    checked={portalNav[key]}
                    onChange={() => toggleFeature(key)}
                    className="h-4 w-4"
                  />
                </label>
              ))}
          </CardContent>
        </Card>

        <div className="mt-6 max-w-2xl rounded-lg border bg-gray-50 p-4 text-sm text-gray-600">
          <p className="font-medium text-gray-900">Always visible for members</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Home</li>
            <li>My Account</li>
            <li>HOA Payment</li>
            <li>HOA Maintenance</li>
            <li>HOA Management</li>
            <li>HOA Covenants</li>
            <li>Contact Us</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
