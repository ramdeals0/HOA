'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PortalNav } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { AuthMeResponse, formatRoleLabel, formatUserDisplayName } from '@/lib/auth-types';
import { getSafeRedirectPath } from '@/lib/auth-routes';
import { switchTenantSession } from '@/lib/switch-tenant';
import { tenantPortalPath } from '@/lib/session-token';

function SelectCommunityContent() {
  const searchParams = useSearchParams();
  const redirectPath = getSafeRedirectPath(searchParams.get('redirect'));
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<AuthMeResponse>('/api/auth/me'),
  });

  const currentSlug = me?.currentTenant?.slug;
  const slugForNav = currentSlug ?? me?.tenants[0]?.tenant.slug ?? 'whisper-groves';

  async function handleSelect(tenantId: string, slug: string) {
    setSwitchingId(tenantId);
    setError('');

    try {
      if (tenantId === me?.currentTenant?.id) {
        window.location.assign(tenantPortalPath(slug, redirectPath));
        return;
      }

      await switchTenantSession(tenantId, slug, redirectPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to switch community.');
      setSwitchingId(null);
    }
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 border-r bg-white p-4 md:block">
        <PortalNav slug={slugForNav} role={me?.currentTenant?.role} />
      </aside>
      <main className="flex-1 p-4 sm:p-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-bold sm:text-3xl">Select Community</h1>
          <p className="mt-1 text-sm text-gray-500">
            Signed in as {formatUserDisplayName(me?.user)}. Choose which HOA portal to open.
          </p>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Your associations</CardTitle>
              <CardDescription>
                {me?.currentTenant
                  ? `Currently viewing ${me.currentTenant.name}.`
                  : 'Pick an association to continue.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && <p className="text-sm text-gray-500">Loading communities...</p>}
              {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

              {!isLoading && (me?.tenants?.length ?? 0) === 0 && (
                <div className="space-y-3 text-sm text-gray-500">
                  <p>No active community memberships found for this account.</p>
                  {me?.user?.isPlatformOwner && (
                    <Link href="/saas-admin" className="inline-block text-blue-600 hover:underline">
                      Open platform admin
                    </Link>
                  )}
                </div>
              )}

              <ul className="space-y-3">
                {(me?.tenants ?? []).map((membership) => {
                  const isCurrent = membership.tenantId === me?.currentTenant?.id;
                  return (
                    <li
                      key={membership.tenantId}
                      className={`rounded-lg border p-4 ${isCurrent ? 'border-blue-200 bg-blue-50/50' : 'bg-white'}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-gray-900">{membership.tenant.name}</p>
                            {isCurrent && <Badge variant="success">Current</Badge>}
                          </div>
                          <p className="mt-1 text-sm text-gray-500">{formatRoleLabel(membership.role)}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={isCurrent ? 'outline' : 'default'}
                          disabled={switchingId === membership.tenantId}
                          onClick={() => handleSelect(membership.tenantId, membership.tenant.slug)}
                        >
                          {switchingId === membership.tenantId
                            ? 'Opening...'
                            : isCurrent
                              ? 'Open portal'
                              : 'Select association'}
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {currentSlug && (
                <p className="mt-6 text-sm text-gray-500">
                  <Link href={`/t/${currentSlug}/portal`} className="text-blue-600 hover:underline">
                    Back to portal
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function SelectCommunityPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <SelectCommunityContent />
    </Suspense>
  );
}
