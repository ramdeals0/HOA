'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { TenantPublicShell } from '@/components/layout/tenant-public-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OfflineNotice } from '@/components/pwa/offline-notice';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { api } from '@/lib/api';

export default function DocumentsPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;
  const isOnline = useOnlineStatus();

  const { isError: tenantError } = useQuery({
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
    <TenantPublicShell
      slug={slug}
      title="Documents"
      description="Public community documents. Logged-in members may see additional documents in the portal."
    >
      <div className="mb-4 flex justify-end">
        <Link href={`/t/${slug}/portal/documents`} className="text-sm text-blue-600 hover:underline">
          Member portal view
        </Link>
      </div>

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
    </TenantPublicShell>
  );
}
