'use client';

import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PortalNav } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api, tenantApi } from '@/lib/api';

export default function AdminApplicationsPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;
  const qc = useQueryClient();

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ currentTenant: { role: string } | null }>('/api/auth/me'),
  });

  const { data } = useQuery({
    queryKey: ['applications', slug],
    queryFn: () =>
      tenantApi<{ applications: Array<{
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        propertyAddress: string;
        status: string;
        message: string | null;
      }> }>(slug, '/applications'),
  });

  async function approve(id: string) {
    await tenantApi(slug, `/applications/${id}/approve`, { method: 'PATCH' });
    qc.invalidateQueries({ queryKey: ['applications', slug] });
  }

  async function reject(id: string) {
    await tenantApi(slug, `/applications/${id}/reject`, { method: 'PATCH' });
    qc.invalidateQueries({ queryKey: ['applications', slug] });
  }

  const pending = (data?.applications ?? []).filter((a) => a.status === 'PENDING');

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-white p-4">
        <PortalNav slug={slug} role={me?.currentTenant?.role} />
      </aside>
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold">Membership Applications</h1>
        <div className="mt-6 space-y-4">
          {pending.length === 0 ? (
            <p className="text-gray-500">No pending applications</p>
          ) : (
            pending.map((app) => (
              <Card key={app.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{app.firstName} {app.lastName}</CardTitle>
                    <Badge variant="warning">PENDING</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{app.email}</p>
                  <p className="text-sm">{app.propertyAddress}</p>
                  {app.message && <p className="mt-2 text-sm italic">{app.message}</p>}
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" onClick={() => approve(app.id)}>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => reject(app.id)}>Reject</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
