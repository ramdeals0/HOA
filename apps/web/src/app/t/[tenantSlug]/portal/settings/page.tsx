'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { PortalNav } from '@/components/layout/header';
import { DirectorySettingsForm } from '@/components/directory/directory-settings-form';
import { api, tenantApi } from '@/lib/api';

const defaultSettings = {
  showInDirectory: false,
  shareEmail: false,
  sharePhone: false,
  shareAddress: false,
  sharePhoto: false,
};

export default function PortalSettingsPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ currentTenant: { role: string } | null }>('/api/auth/me'),
  });

  const { data: account, isLoading, error } = useQuery({
    queryKey: ['account', slug],
    queryFn: () =>
      tenantApi<{
        directorySettings: {
          showInDirectory: boolean;
          shareEmail: boolean;
          sharePhone: boolean;
          shareAddress: boolean;
          sharePhoto: boolean;
        } | null;
      }>(slug, '/account'),
  });

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-white p-4">
        <PortalNav slug={slug} role={me?.currentTenant?.role} />
      </aside>
      <main className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Privacy Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Control how you appear in the{' '}
            <Link href={`/t/${slug}/portal/directory`} className="text-blue-600 hover:underline">
              resident directory
            </Link>
            .
          </p>
        </div>

        {isLoading && <p className="text-gray-500">Loading settings...</p>}
        {error && (
          <p className="text-red-600">
            {error instanceof Error ? error.message : 'Failed to load settings'}
          </p>
        )}

        {!isLoading && !error && (
          <div className="max-w-2xl">
            <DirectorySettingsForm
              slug={slug}
              initialSettings={account?.directorySettings ?? defaultSettings}
            />
          </div>
        )}
      </main>
    </div>
  );
}
