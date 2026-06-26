'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PortalNav } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { api, tenantApi, formatCurrency, formatDate } from '@/lib/api';

type PaymentRecord = {
  id: string;
  amountCents: number;
  status: string;
  createdAt: string;
  invoice: { description: string };
};

function formatInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function defaultFromDate() {
  const date = new Date();
  date.setMonth(date.getMonth() - 11);
  return formatInputDate(date);
}

export default function PaymentsPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;

  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(() => formatInputDate(new Date()));
  const [appliedRange, setAppliedRange] = useState<{ from: string; to: string } | null>(null);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ currentTenant: { role: string } | null }>('/api/auth/me'),
  });

  const statementsPath = useMemo(() => {
    if (!appliedRange) {
      return '/invoices/statements/my';
    }
    const search = new URLSearchParams({
      from: appliedRange.from,
      to: appliedRange.to,
    });
    return `/invoices/statements/my?${search.toString()}`;
  }, [appliedRange]);

  const { data } = useQuery({
    queryKey: ['statements', slug, appliedRange?.from ?? 'all', appliedRange?.to ?? 'all'],
    queryFn: () =>
      tenantApi<{
        invoices: Array<{ id: string; amountCents: number; status: string; dueDate: string; description: string }>;
        payments: PaymentRecord[];
        filters: { from: string | null; to: string | null };
      }>(slug, statementsPath),
  });

  async function payNow(invoiceId: string) {
    const session = await tenantApi<{ url: string }>(slug, '/payments/checkout-session', {
      method: 'POST',
      body: JSON.stringify({ invoiceId }),
    });
    if (session.url) window.location.href = session.url;
  }

  function applyDateRange() {
    if (fromDate && toDate && fromDate > toDate) {
      return;
    }
    setAppliedRange(fromDate && toDate ? { from: fromDate, to: toDate } : null);
  }

  function clearDateRange() {
    setAppliedRange(null);
    setFromDate(defaultFromDate());
    setToDate(formatInputDate(new Date()));
  }

  const payments = data?.payments ?? [];
  const rangeInvalid = Boolean(fromDate && toDate && fromDate > toDate);

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
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border bg-gray-50 p-4">
              <div>
                <label htmlFor="payment-from" className="mb-1 block text-xs font-medium text-gray-600">
                  From
                </label>
                <Input
                  id="payment-from"
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  className="w-40"
                />
              </div>
              <div>
                <label htmlFor="payment-to" className="mb-1 block text-xs font-medium text-gray-600">
                  To
                </label>
                <Input
                  id="payment-to"
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                  className="w-40"
                />
              </div>
              <Button size="sm" onClick={applyDateRange} disabled={rangeInvalid}>
                Search
              </Button>
              {appliedRange && (
                <Button size="sm" variant="outline" onClick={clearDateRange}>
                  Show all
                </Button>
              )}
            </div>

            {rangeInvalid && (
              <p className="mb-4 text-sm text-red-600">Start date must be on or before end date.</p>
            )}

            {appliedRange && !rangeInvalid && (
              <p className="mb-4 text-sm text-gray-500">
                Showing payments from {formatDate(appliedRange.from)} to {formatDate(appliedRange.to)}.
              </p>
            )}

            {payments.length === 0 ? (
              <p className="text-sm text-gray-500">No payments found for the selected date range.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2">Description</th>
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b">
                      <td className="py-2">{payment.invoice.description}</td>
                      <td>{formatDate(payment.createdAt)}</td>
                      <td>{formatCurrency(payment.amountCents)}</td>
                      <td>
                        <Badge variant={payment.status === 'SUCCEEDED' ? 'success' : 'warning'}>
                          {payment.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
