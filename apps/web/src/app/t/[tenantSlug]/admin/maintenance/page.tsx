'use client';

import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PortalNav } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api, tenantApi, formatDate } from '@/lib/api';

const COLUMNS = [
  { key: 'OPEN', label: 'Open' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'DONE', label: 'Done' },
] as const;

type RequestItem = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  requester: { firstName: string; lastName: string; email: string };
  property: { street: string } | null;
};

export default function AdminMaintenancePage() {
  const params = useParams();
  const slug = params.tenantSlug as string;
  const qc = useQueryClient();

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ currentTenant: { role: string } | null }>('/api/auth/me'),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-maintenance', slug],
    queryFn: () => tenantApi<{ requests: RequestItem[] }>(slug, '/maintenance'),
  });

  async function updateStatus(id: string, status: string) {
    await tenantApi(slug, `/maintenance/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    qc.invalidateQueries({ queryKey: ['admin-maintenance', slug] });
  }

  const requests = data?.requests ?? [];
  const byStatus = (status: string) => requests.filter((r) => r.status === status);

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-white p-4">
        <PortalNav slug={slug} role={me?.currentTenant?.role} />
      </aside>
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold">Maintenance Board</h1>

        {isLoading && <p className="mt-4 text-gray-500">Loading...</p>}
        {error && (
          <p className="mt-4 text-red-600">
            {error instanceof Error ? error.message : 'Failed to load maintenance requests'}
          </p>
        )}

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {COLUMNS.map((col) => (
            <Card key={col.key}>
              <CardHeader>
                <CardTitle className="text-base">
                  {col.label}{' '}
                  <span className="text-gray-400">({byStatus(col.key).length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {byStatus(col.key).length === 0 ? (
                  <p className="text-sm text-gray-400">No requests</p>
                ) : (
                  byStatus(col.key).map((r) => (
                    <div key={r.id} className="rounded-lg border bg-gray-50 p-3 text-sm">
                      <p className="font-medium">{r.title}</p>
                      <p className="mt-1 line-clamp-2 text-gray-600">{r.description}</p>
                      <p className="mt-2 text-xs text-gray-500">
                        {r.requester.firstName} {r.requester.lastName}
                        {r.property ? ` · ${r.property.street}` : ''}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(r.createdAt)}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge variant="warning">{r.priority}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {COLUMNS.filter((c) => c.key !== col.key).map((next) => (
                          <button
                            key={next.key}
                            type="button"
                            onClick={() => updateStatus(r.id, next.key)}
                            className="rounded border bg-white px-2 py-1 text-xs hover:bg-gray-100"
                          >
                            Move to {next.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
