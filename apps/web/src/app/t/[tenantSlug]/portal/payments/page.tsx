'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PortalShell } from '@/components/layout/portal-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { OfflineNotice } from '@/components/pwa/offline-notice';
import { useOfflineAction } from '@/components/pwa/offline-action-provider';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { api, tenantApi, formatCurrency, formatDate } from '@/lib/api';

type PaymentRecord = {
  id: string;
  amountCents: number;
  status: string;
  createdAt: string;
  invoice: { description: string; dueDate: string };
};

type PaidInvoiceRecord = {
  id: string;
  amountCents: number;
  status: string;
  dueDate: string;
  description: string;
  payments: Array<{ createdAt: string; status: string }>;
};

function formatInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function defaultFromDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 3);
  date.setMonth(0);
  date.setDate(1);
  return formatInputDate(date);
}

function buildDefaultRange() {
  return {
    from: defaultFromDate(),
    to: formatInputDate(new Date()),
  };
}

export default function PaymentsPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;
  const isOnline = useOnlineStatus();
  const { guardAction } = useOfflineAction();
  const defaultRange = useMemo(() => buildDefaultRange(), []);

  const [fromDate, setFromDate] = useState(defaultRange.from);
  const [toDate, setToDate] = useState(defaultRange.to);
  const [appliedRange, setAppliedRange] = useState(defaultRange);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ currentTenant: { role: string } | null }>('/api/auth/me'),
  });

  const statementsPath = useMemo(() => {
    const search = new URLSearchParams({
      from: appliedRange.from,
      to: appliedRange.to,
    });
    return `/invoices/statements/my?${search.toString()}`;
  }, [appliedRange]);

  const { data } = useQuery({
    queryKey: ['statements', slug, appliedRange.from, appliedRange.to],
    queryFn: () =>
      tenantApi<{
        invoices: Array<{ id: string; amountCents: number; status: string; dueDate: string; description: string }>;
        payments: PaymentRecord[];
        paidInvoices: PaidInvoiceRecord[];
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
    if (fromDate && toDate) {
      setAppliedRange({ from: fromDate, to: toDate });
    }
  }

  function clearDateRange() {
    const range = buildDefaultRange();
    setAppliedRange(range);
    setFromDate(range.from);
    setToDate(range.to);
  }

  function showAllHistory() {
    setAppliedRange({ from: '1900-01-01', to: formatInputDate(new Date()) });
    setFromDate('1900-01-01');
    setToDate(formatInputDate(new Date()));
  }

  const openInvoices = data?.invoices ?? [];
  const payments = data?.payments ?? [];
  const paidInvoices = data?.paidInvoices ?? [];
  const rangeInvalid = Boolean(fromDate && toDate && fromDate > toDate);
  const showingAllHistory = appliedRange.from === '1900-01-01';

  return (
    <PortalShell slug={slug} role={me?.currentTenant?.role}>
      <h1 className="text-2xl font-bold sm:text-3xl">Statements & Payments</h1>
      <OfflineNotice
        visible={!isOnline && Boolean(payments.length || openInvoices.length || paidInvoices.length)}
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Outstanding Invoices</CardTitle>
          <CardDescription>Open and overdue dues that still need payment</CardDescription>
        </CardHeader>
        <CardContent>
          {openInvoices.length === 0 ? (
            <p className="text-sm text-gray-500">No outstanding invoices. You are all caught up.</p>
          ) : (
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
                {openInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b">
                    <td className="py-2">{inv.description}</td>
                    <td>{formatDate(inv.dueDate)}</td>
                    <td>{formatCurrency(inv.amountCents)}</td>
                    <td>
                      <Badge variant={inv.status === 'PAID' ? 'success' : 'warning'}>{inv.status}</Badge>
                    </td>
                    <td>
                      {(inv.status === 'OPEN' || inv.status === 'OVERDUE') && (
                        <Button
                          size="sm"
                          disabled={!isOnline}
                          onClick={() => guardAction(() => payNow(inv.id))}
                        >
                          Pay
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Search paid invoices and receipts by date</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border bg-gray-50 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              applyDateRange();
            }}
          >
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
            <Button size="sm" type="submit" disabled={rangeInvalid}>
              Search
            </Button>
            <Button size="sm" type="button" variant="outline" onClick={showAllHistory}>
              Show all
            </Button>
            {!showingAllHistory && (
              <Button size="sm" type="button" variant="ghost" onClick={clearDateRange}>
                Reset to last 3 years
              </Button>
            )}
          </form>

          {rangeInvalid && (
            <p className="mb-4 text-sm text-red-600">Start date must be on or before end date.</p>
          )}

          {!rangeInvalid && !showingAllHistory && (
            <p className="mb-4 text-sm text-gray-500">
              Showing paid invoices and payments from {formatDate(appliedRange.from)} to{' '}
              {formatDate(appliedRange.to)}.
            </p>
          )}

          {paidInvoices.length === 0 && payments.length === 0 ? (
            <p className="text-sm text-gray-500">No paid invoices found for the selected date range.</p>
          ) : (
            <div className="space-y-8">
              {paidInvoices.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">Paid invoices</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2">Description</th>
                        <th className="pb-2">Due date</th>
                        <th className="pb-2">Paid on</th>
                        <th className="pb-2">Amount</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paidInvoices.map((invoice) => {
                        const latestPayment = invoice.payments[0];
                        return (
                          <tr key={invoice.id} className="border-b">
                            <td className="py-2">{invoice.description}</td>
                            <td>{formatDate(invoice.dueDate)}</td>
                            <td>{latestPayment ? formatDate(latestPayment.createdAt) : '—'}</td>
                            <td>{formatCurrency(invoice.amountCents)}</td>
                            <td>
                              <Badge variant="success">{invoice.status}</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {payments.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">Payment receipts</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2">Description</th>
                        <th className="pb-2">Due date</th>
                        <th className="pb-2">Paid on</th>
                        <th className="pb-2">Amount</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id} className="border-b">
                          <td className="py-2">{payment.invoice.description}</td>
                          <td>{formatDate(payment.invoice.dueDate)}</td>
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
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </PortalShell>
  );
}
