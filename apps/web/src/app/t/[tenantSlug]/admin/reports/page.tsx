'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PortalNav } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api, downloadTenantCsv, formatCurrency, formatDate, tenantApi } from '@/lib/api';

type Tab = 'collections' | 'members';

function defaultReportRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 90);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function MonthlyBarChart({
  monthly,
}: {
  monthly: Array<{ month: string; invoicedCents: number; paidCents: number }>;
}) {
  const maxValue = Math.max(...monthly.map((entry) => Math.max(entry.invoicedCents, entry.paidCents)), 1);

  if (monthly.length === 0) {
    return <p className="text-sm text-gray-500">No collection activity in this date range.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-xs text-gray-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-blue-500" />
          Invoiced
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-green-500" />
          Paid
        </span>
      </div>
      <div className="space-y-3">
        {monthly.map((entry) => (
          <div key={entry.month}>
            <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
              <span>{entry.month}</span>
              <span>
                {formatCurrency(entry.paidCents)} / {formatCurrency(entry.invoicedCents)}
              </span>
            </div>
            <div className="space-y-1">
              <div className="h-3 rounded bg-gray-100">
                <div
                  className="h-3 rounded bg-blue-500"
                  style={{ width: `${Math.max(4, (entry.invoicedCents / maxValue) * 100)}%` }}
                />
              </div>
              <div className="h-3 rounded bg-gray-100">
                <div
                  className="h-3 rounded bg-green-500"
                  style={{ width: `${Math.max(4, (entry.paidCents / maxValue) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminReportsPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;
  const initialRange = useMemo(() => defaultReportRange(), []);
  const [tab, setTab] = useState<Tab>('collections');
  const [fromDate, setFromDate] = useState(initialRange.from);
  const [toDate, setToDate] = useState(initialRange.to);
  const [appliedRange, setAppliedRange] = useState(initialRange);
  const [downloadError, setDownloadError] = useState('');

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ currentTenant: { role: string } | null }>('/api/auth/me'),
  });

  const queryString = `from=${appliedRange.from}&to=${appliedRange.to}`;

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['reports-summary', slug, appliedRange.from, appliedRange.to],
    queryFn: () =>
      tenantApi<{
        totals: {
          invoicedCents: number;
          paidCents: number;
          overdueCents: number;
          collectionRate: number;
        };
        monthly: Array<{ month: string; invoicedCents: number; paidCents: number }>;
      }>(slug, `/reports/collections-summary?${queryString}`),
    enabled: tab === 'collections',
  });

  const { data: membersSummary } = useQuery({
    queryKey: ['reports-members-summary', slug],
    queryFn: () =>
      tenantApi<{
        totalMembers: number;
        activeMembers: number;
        pendingMembers: number;
        pendingApplications: number;
      }>(slug, '/reports/members-summary'),
    enabled: tab === 'members',
  });

  const { data: delinquencies } = useQuery({
    queryKey: ['reports-delinquencies', slug],
    queryFn: () =>
      tenantApi<{
        delinquencies: Array<{
          invoiceId: string;
          memberName: string;
          amountCents: number;
          status: string;
          dueDate: string;
          daysPastDue: number;
        }>;
      }>(slug, '/reports/delinquencies'),
    enabled: tab === 'collections',
  });

  function applyRange() {
    if (fromDate > toDate) return;
    setAppliedRange({ from: fromDate, to: toDate });
  }

  async function exportCsv(type: 'invoices' | 'payments' | 'members') {
    setDownloadError('');
    try {
      if (type === 'members') {
        await downloadTenantCsv(slug, '/reports/members.csv', 'members.csv');
        return;
      }

      const filename = `${type}-${appliedRange.from}-to-${appliedRange.to}.csv`;
      await downloadTenantCsv(
        slug,
        `/reports/${type}.csv?${queryString}`,
        filename,
      );
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Export failed');
    }
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-white p-4">
        <PortalNav slug={slug} role={me?.currentTenant?.role} />
      </aside>
      <main className="flex-1 p-4 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold sm:text-3xl">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">Board-level collections and member exports</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={tab === 'collections' ? 'default' : 'outline'}
            onClick={() => setTab('collections')}
          >
            Collections
          </Button>
          <Button
            variant={tab === 'members' ? 'default' : 'outline'}
            onClick={() => setTab('members')}
          >
            Members
          </Button>
        </div>

        {tab === 'collections' && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Date Range</CardTitle>
                <CardDescription>Default is the last 90 days</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-end gap-3">
                <div>
                  <label htmlFor="from-date" className="mb-1 block text-xs font-medium text-gray-600">
                    From
                  </label>
                  <Input
                    id="from-date"
                    type="date"
                    value={fromDate}
                    onChange={(event) => setFromDate(event.target.value)}
                    className="w-40"
                  />
                </div>
                <div>
                  <label htmlFor="to-date" className="mb-1 block text-xs font-medium text-gray-600">
                    To
                  </label>
                  <Input
                    id="to-date"
                    type="date"
                    value={toDate}
                    onChange={(event) => setToDate(event.target.value)}
                    className="w-40"
                  />
                </div>
                <Button onClick={applyRange}>Apply</Button>
              </CardContent>
            </Card>

            {summaryLoading && <p className="text-gray-500">Loading summary...</p>}

            {summary && (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-gray-500">Invoiced</p>
                      <p className="text-2xl font-bold">{formatCurrency(summary.totals.invoicedCents)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-gray-500">Paid</p>
                      <p className="text-2xl font-bold">{formatCurrency(summary.totals.paidCents)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-gray-500">Overdue</p>
                      <p className="text-2xl font-bold">{formatCurrency(summary.totals.overdueCents)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-gray-500">Collection Rate</p>
                      <p className="text-2xl font-bold">{summary.totals.collectionRate.toFixed(1)}%</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Invoiced vs Paid by Month</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MonthlyBarChart monthly={summary.monthly} />
                  </CardContent>
                </Card>
              </>
            )}

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Exports</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => exportCsv('invoices')}>
                  Export Invoices CSV
                </Button>
                <Button variant="outline" onClick={() => exportCsv('payments')}>
                  Export Payments CSV
                </Button>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Delinquencies</CardTitle>
                <CardDescription>Open and overdue invoices</CardDescription>
              </CardHeader>
              <CardContent>
                {(delinquencies?.delinquencies ?? []).length === 0 ? (
                  <p className="text-sm text-gray-500">No delinquent invoices right now.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-gray-500">
                          <th className="pb-2">Member</th>
                          <th className="pb-2">Due</th>
                          <th className="pb-2">Amount</th>
                          <th className="pb-2">Status</th>
                          <th className="pb-2">Days past due</th>
                        </tr>
                      </thead>
                      <tbody>
                        {delinquencies?.delinquencies.map((item) => (
                          <tr key={item.invoiceId} className="border-b last:border-0">
                            <td className="py-3">{item.memberName}</td>
                            <td>{formatDate(item.dueDate)}</td>
                            <td>{formatCurrency(item.amountCents)}</td>
                            <td>
                              <Badge variant={item.status === 'OVERDUE' ? 'destructive' : 'warning'}>
                                {item.status}
                              </Badge>
                            </td>
                            <td>{item.daysPastDue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {tab === 'members' && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-500">Total members</p>
                  <p className="text-2xl font-bold">{membersSummary?.totalMembers ?? 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-500">Active</p>
                  <p className="text-2xl font-bold">{membersSummary?.activeMembers ?? 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-500">Pending / invited</p>
                  <p className="text-2xl font-bold">{membersSummary?.pendingMembers ?? 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-500">Pending applications</p>
                  <p className="text-2xl font-bold">{membersSummary?.pendingApplications ?? 0}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Member Export</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={() => exportCsv('members')}>
                  Export Members CSV
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {downloadError && <p className="mt-4 text-sm text-red-600">{downloadError}</p>}
      </main>
    </div>
  );
}
