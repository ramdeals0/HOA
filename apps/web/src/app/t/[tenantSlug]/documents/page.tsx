'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { TenantHeader } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OfflineNotice } from '@/components/pwa/offline-notice';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { api } from '@/lib/api';

export default function DocumentsPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;
  const isOnline = useOnlineStatus();

  const { data: tenant, isError: tenantError } = useQuery({
    queryKey: ['tenant', slug],
    queryFn: () => api<{ name: string; slug: string }>(`/api/tenants/${slug}`),
    retry: 1,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-documents', slug],
    queryFn: () =>
      api<{
        documents: Array<{
          id: string;
          title: string;
          description: string | null;
          fileUrl: string;
          visibility: string;
        }>;
      }>(`/api/t/${slug}/documents`, { tenantSlug: slug }),
    retry: 1,
  });

  const documents = data?.documents ?? [];

  if (tenantError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <p className="text-sm text-red-600">Community not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TenantHeader slug={slug} name={tenant?.name ?? 'Community'} />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold sm:text-3xl">Documents</h1>
          <Link href={`/t/${slug}/portal/documents`} className="text-sm text-blue-600 hover:underline">
            Member portal view
          </Link>
        </div>
        <p className="mb-4 text-sm text-gray-600">
          Public community documents. Logged-in members may see additional documents in the portal.
        </p>
        <OfflineNotice visible={!isOnline && documents.length > 0} />

        {isLoading && <p className="text-gray-500">Loading documents...</p>}
        {isError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error instanceof Error ? error.message : 'Unable to load documents right now.'}
          </p>
        )}

        {!isLoading && !isError && documents.length === 0 && (
          <p className="text-sm text-gray-500">No public documents are available yet.</p>
        )}

        <div className="space-y-4">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <CardTitle className="text-lg">{doc.title}</CardTitle>
                {doc.description && <p className="text-sm text-gray-500">{doc.description}</p>}
              </CardHeader>
              <CardContent>
                {isOnline ? (
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center text-blue-600 hover:underline"
                  >
                    Open document
                  </a>
                ) : (
                  <p className="text-sm text-gray-500">Document downloads require an internet connection.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
