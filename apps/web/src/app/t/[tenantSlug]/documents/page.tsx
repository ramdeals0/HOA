'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { TenantHeader } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OfflineNotice } from '@/components/pwa/offline-notice';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { api } from '@/lib/api';

export default function DocumentsPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;
  const isOnline = useOnlineStatus();

  const { data: tenant } = useQuery({
    queryKey: ['tenant', slug],
    queryFn: () => api<{ name: string; slug: string }>(`/api/tenants/${slug}`),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['documents', slug],
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
  });

  const documents = data?.documents ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <TenantHeader slug={slug} name={tenant?.name ?? 'Community'} />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <h1 className="mb-6 text-2xl font-bold sm:text-3xl">Documents</h1>
        <p className="mb-4 text-sm text-gray-600">
          Document metadata is available offline after your first visit. File downloads require a
          connection.
        </p>
        <OfflineNotice visible={!isOnline && documents.length > 0} />

        {isLoading && <p className="text-gray-500">Loading documents...</p>}
        {error && documents.length === 0 && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {isOnline
              ? 'Unable to load documents right now.'
              : 'You are offline and no cached documents are available yet. Visit this page once while online to enable offline browsing.'}
          </p>
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
                    Download PDF
                  </a>
                ) : (
                  <p className="text-sm text-gray-500">Download unavailable while offline.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
