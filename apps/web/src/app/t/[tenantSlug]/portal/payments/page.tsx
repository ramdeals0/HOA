'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PortalNav } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api, tenantApi, formatCurrency, formatDate } from '@/lib/api';

export default function PaymentsPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ currentTenant: { role: string } | null }>('/api/auth/me'),
  });

  const { data, refetch } = useQuery({
    queryKey: ['statements', slug],
    queryFn: () =>
      tenantApi<{
        invoices: Array<{ id: string; amountCents: number; status: string; dueDate: string; description: string }>;
        payments: Array<{ id: string; amountCents: number; status: string; createdAt: string; invoice: { description: string } }>;
      }>(slug, '/invoices/statements/my'),
  });

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
        <PortalNav slug={slug} role={me?.currentTenant?.role} />
      </aside>
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold">Statements & Payments</h1>

        <Card className="mt-6">
          <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2">Description</th>
                  <th className="pb-2">Due</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(data?.invoices ?? []).map((inv) => (
                  <tr key={inv.id} className="border-b">
                    <td className="py-2">{inv.description}</td>
                    <td>{formatDate(inv.dueDate)}</td>
                    <td>{formatCurrency(inv.amountCents)}</td>
                    <td><Badge variant={inv.status === 'PAID' ? 'success' : 'warning'}>{inv.status}</Badge></td>
                    <td>
                      {(inv.status === 'OPEN' || inv.status === 'OVERDUE') && (
                        <Button size="sm" onClick={() => payNow(inv.id)}>Pay</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {(data?.payments ?? []).map((p) => (
                <li key={p.id} className="flex justify-between border-b py-2">
                  <span>{p.invoice.description}</span>
                  <span>{formatCurrency(p.amountCents)} · {formatDate(p.createdAt)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
