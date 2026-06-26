'use client';

import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PortalNav } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api, tenantApi, formatCurrency } from '@/lib/api';

export default function AdminClassifiedsPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;
  const qc = useQueryClient();

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ currentTenant: { role: string } | null }>('/api/auth/me'),
  });

  const { data } = useQuery({
    queryKey: ['admin-classifieds', slug],
    queryFn: () =>
      tenantApi<{ listings: Array<{ id: string; title: string; description: string; category: string; priceCents: number | null; status: string }> }>(
        slug,
        '/classifieds?all=true&status=PENDING',
      ),
  });

  async function approve(id: string) {
    await tenantApi(slug, `/classifieds/${id}/approve`, { method: 'PATCH' });
    qc.invalidateQueries({ queryKey: ['admin-classifieds', slug] });
  }

  async function reject(id: string) {
    await tenantApi(slug, `/classifieds/${id}/reject`, { method: 'PATCH' });
    qc.invalidateQueries({ queryKey: ['admin-classifieds', slug] });
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-white p-4">
        <PortalNav slug={slug} role={me?.currentTenant?.role} />
      </aside>
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold">Classified Approvals</h1>
        <div className="mt-6 space-y-4">
          {(data?.listings ?? []).map((listing) => (
            <Card key={listing.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{listing.title}</CardTitle>
                  <Badge variant="warning">{listing.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{listing.description}</p>
                <p className="mt-1 text-sm">{listing.category}{listing.priceCents != null && ` · ${formatCurrency(listing.priceCents)}`}</p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={() => approve(listing.id)}>Approve</Button>
                  <Button size="sm" variant="destructive" onClick={() => reject(listing.id)}>Reject</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
