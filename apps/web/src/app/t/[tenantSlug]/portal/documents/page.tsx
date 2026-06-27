'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PortalShell } from '@/components/layout/portal-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OfflineNotice } from '@/components/pwa/offline-notice';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { api, tenantApi } from '@/lib/api';

function visibilityLabel(visibility: string) {
  switch (visibility) {
    case 'PUBLIC':
      return 'Public';
    case 'MEMBERS':
      return 'Members';
    case 'BOARD':
      return 'Board';
    case 'FINANCIAL':
      return 'Financial';
    default:
      return visibility;
  }
}

export default function PortalDocumentsPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;
  const isOnline = useOnlineStatus();

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ currentTenant: { role: string } | null }>('/api/auth/me'),
  });

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['documents', slug],
    queryFn: () =>
      tenantApi<{
        documents: Array<{
          id: string;
          title: string;
          description: string | null;
          fileUrl: string;
          visibility: string;
        }>;
      }>(slug, '/documents'),
  });

  const documents = data?.documents ?? [];
  const role = me?.currentTenant?.role;
  const isStaff = role && ['SUPER_ADMIN', 'BOARD', 'MANAGER'].includes(role);

  return (
    <PortalShell slug={slug} role={role}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Documents</h1>
        <p className="mt-1 text-sm text-gray-500">
          Community documents available to you based on your membership role.
        </p>
      </div>

      <OfflineNotice visible={!isOnline && documents.length > 0} />

      {isLoading && <p className="text-gray-500">Loading documents...</p>}
      {isError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error instanceof Error ? error.message : 'Unable to load documents right now.'}
        </p>
      )}

      {!isLoading && !isError && documents.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-gray-500">
            No documents are available for your account yet.
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {documents.map((doc) => (
          <Card key={doc.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">{doc.title}</CardTitle>
                  {doc.description && <p className="mt-1 text-sm text-gray-500">{doc.description}</p>}
                </div>
                {isStaff && <Badge variant="outline">{visibilityLabel(doc.visibility)}</Badge>}
              </div>
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
    </PortalShell>
  );
}
