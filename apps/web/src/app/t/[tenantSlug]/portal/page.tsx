'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { PortalNav } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api, tenantApi, formatCurrency, formatDate } from '@/lib/api';

export default function PortalDashboard() {
  const params = useParams();
  const slug = params.tenantSlug as string;

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ currentTenant: { role: string } | null }>('/api/auth/me'),
  });

  const { data: invoices } = useQuery({
    queryKey: ['my-invoices', slug],
    queryFn: () => tenantApi<{ invoices: Array<{ id: string; amountCents: number; dueDate: string; status: string; description: string }> }>(slug, '/invoices/my'),
  });

  const { data: news } = useQuery({
    queryKey: ['news', slug],
    queryFn: () => tenantApi<{ posts: Array<{ id: string; title: string; createdAt: string }> }>(slug, '/news'),
  });

  const { data: maintenance } = useQuery({
    queryKey: ['my-maintenance', slug],
    queryFn: () => tenantApi<{ requests: Array<{ id: string; title: string; status: string }> }>(slug, '/maintenance/my'),
  });

  const unpaid = invoices?.invoices.filter((i) => i.status === 'OPEN' || i.status === 'OVERDUE') ?? [];
  const nextDue = unpaid.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
  const role = me?.currentTenant?.role;

  async function payNow(invoiceId: string) {
    const session = await tenantApi<{ url: string }>(slug, '/payments/checkout-session', {
      method: 'POST',
      body: JSON.stringify({ invoiceId }),
    });
    if (session.url) window.location.href = session.url;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-white p-4">
        <PortalNav slug={slug} role={role} />
      </aside>
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Next Dues Due</CardTitle>
            </CardHeader>
            <CardContent>
              {nextDue ? (
                <>
                  <p className="text-2xl font-bold">{formatCurrency(nextDue.amountCents)}</p>
                  <p className="text-sm text-gray-500">Due {formatDate(nextDue.dueDate)}</p>
                  <Button className="mt-4" onClick={() => payNow(nextDue.id)}>Pay Now</Button>
                </>
              ) : (
                <p className="text-gray-500">No unpaid invoices</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Unpaid Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {unpaid.length === 0 ? (
                <p className="text-gray-500">All caught up!</p>
              ) : (
                <ul className="space-y-2">
                  {unpaid.map((inv) => (
                    <li key={inv.id} className="flex items-center justify-between text-sm">
                      <span>{inv.description}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={inv.status === 'OVERDUE' ? 'destructive' : 'warning'}>{inv.status}</Badge>
                        <Button size="sm" onClick={() => payNow(inv.id)}>Pay</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Latest News</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(news?.posts ?? []).slice(0, 5).map((p) => (
                <li key={p.id}>
                  <Link href={`/t/${slug}/news/${p.id}`} className="text-blue-600 hover:underline">
                    {p.title}
                  </Link>
                  <span className="ml-2 text-xs text-gray-400">{formatDate(p.createdAt)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Maintenance Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {(maintenance?.requests ?? []).length === 0 ? (
              <p className="text-gray-500">No maintenance requests</p>
            ) : (
              <ul className="space-y-2">
                {maintenance?.requests.map((r) => (
                  <li key={r.id} className="flex justify-between text-sm">
                    <span>{r.title}</span>
                    <Badge variant="outline">{r.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
