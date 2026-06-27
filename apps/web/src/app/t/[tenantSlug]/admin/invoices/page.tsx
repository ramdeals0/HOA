'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PortalNav } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api, tenantApi, formatCurrency, formatDate } from '@/lib/api';

export default function AdminInvoicesPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;
  const qc = useQueryClient();
  const [monthlyDues, setMonthlyDues] = useState('50');

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ currentTenant: { role: string } | null }>('/api/auth/me'),
  });

  const { data } = useQuery({
    queryKey: ['admin-invoices', slug],
    queryFn: () =>
      tenantApi<{
        invoices: Array<{ id: string; amountCents: number; status: string; dueDate: string; user: { firstName: string; lastName: string } }>;
        metrics: { paid: { count: number; totalCents: number }; unpaid: { count: number; totalCents: number }; overdue: { count: number; totalCents: number } };
      }>(slug, '/invoices'),
  });

  async function saveDues() {
    await tenantApi(slug, '/invoices/settings/dues', {
      method: 'PATCH',
      body: JSON.stringify({ monthlyDuesCents: Math.round(parseFloat(monthlyDues) * 100) }),
    });
  }

  async function generateAnnualInvoices() {
    const year = new Date().getFullYear();
    const periodStart = new Date(year, 0, 1);
    const periodEnd = new Date(year, 11, 31, 23, 59, 59);
    const dueDate = new Date(year, 0, 1);
    await tenantApi(slug, '/invoices/generate', {
      method: 'POST',
      body: JSON.stringify({
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        dueDate: dueDate.toISOString(),
        description: `Annual HOA Dues ${year}`,
        amountCents: 5000,
      }),
    });
    qc.invalidateQueries({ queryKey: ['admin-invoices', slug] });
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-white p-4">
        <PortalNav slug={slug} role={me?.currentTenant?.role} />
      </aside>
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold">Dues & Invoices</h1>

        {data?.metrics && (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Paid</p><p className="text-2xl font-bold">{data.metrics.paid.count}</p><p className="text-sm">{formatCurrency(data.metrics.paid.totalCents)}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Unpaid</p><p className="text-2xl font-bold">{data.metrics.unpaid.count}</p><p className="text-sm">{formatCurrency(data.metrics.unpaid.totalCents)}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Overdue</p><p className="text-2xl font-bold">{data.metrics.overdue.count}</p><p className="text-sm">{formatCurrency(data.metrics.overdue.totalCents)}</p></CardContent></Card>
          </div>
        )}

        <Card className="mt-6">
          <CardHeader><CardTitle>Configure Dues</CardTitle></CardHeader>
          <CardContent className="flex gap-4">
            <Input type="number" placeholder="Annual dues ($)" value={monthlyDues} onChange={(e) => setMonthlyDues(e.target.value)} className="max-w-xs" />
            <Button onClick={saveDues}>Save</Button>
            <Button variant="outline" onClick={generateAnnualInvoices}>Generate $50 Annual Invoices (Jan 1)</Button>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader><CardTitle>All Invoices</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2">Member</th>
                  <th className="pb-2">Due</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.invoices ?? []).map((inv) => (
                  <tr key={inv.id} className="border-b">
                    <td className="py-2">{inv.user.firstName} {inv.user.lastName}</td>
                    <td>{formatDate(inv.dueDate)}</td>
                    <td>{formatCurrency(inv.amountCents)}</td>
                    <td><Badge variant={inv.status === 'PAID' ? 'success' : inv.status === 'OVERDUE' ? 'destructive' : 'warning'}>{inv.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
