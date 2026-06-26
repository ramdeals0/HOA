'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PortalNav } from '@/components/layout/header';
import { UpsellBanner } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { api, tenantApi, formatDate } from '@/lib/api';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

export default function MaintenancePage() {
  const params = useParams();
  const slug = params.tenantSlug as string;
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>('MEDIUM');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () =>
      api<{ currentTenant: { role: string; plan?: string } | null }>('/api/auth/me'),
  });

  const { data: tenant } = useQuery({
    queryKey: ['tenant', slug],
    queryFn: () => api<{ plan: string }>(`/api/tenants/${slug}`),
  });

  const { data: requests, error: loadError } = useQuery({
    queryKey: ['my-maintenance', slug],
    queryFn: () =>
      tenantApi<{
        requests: Array<{
          id: string;
          title: string;
          description: string;
          status: string;
          priority: string;
          createdAt: string;
        }>;
      }>(slug, '/maintenance/my'),
  });

  const plan = tenant?.plan ?? me?.currentTenant?.plan ?? 'FREE';
  const canUseMaintenance = plan !== 'FREE';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitted(false);
    try {
      await tenantApi(slug, '/maintenance', {
        method: 'POST',
        body: JSON.stringify({ title, description, priority }),
      });
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setSubmitted(true);
      qc.invalidateQueries({ queryKey: ['my-maintenance', slug] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    }
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-white p-4">
        <PortalNav slug={slug} role={me?.currentTenant?.role} />
      </aside>
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold">Maintenance Requests</h1>

        {!canUseMaintenance && (
          <div className="mt-4">
            <UpsellBanner feature="Maintenance requests" plan={plan} />
          </div>
        )}

        {canUseMaintenance && (
          <Card className="mt-6 max-w-2xl">
            <CardHeader>
              <CardTitle>Submit a request</CardTitle>
              <CardDescription>Report an issue for board or manager review</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="Title (e.g. Broken gate latch)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <Textarea
                  placeholder="Describe the issue..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                />
                <div>
                  <label htmlFor="priority" className="text-sm font-medium text-gray-700">
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as (typeof PRIORITIES)[number])}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                {submitted && <p className="text-sm text-green-600">Request submitted successfully.</p>}
                <Button type="submit">Submit request</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>My requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loadError && (
              <p className="text-sm text-red-600">
                {loadError instanceof Error ? loadError.message : 'Failed to load requests'}
              </p>
            )}
            {(requests?.requests ?? []).length === 0 ? (
              <p className="text-sm text-gray-500">No maintenance requests yet.</p>
            ) : (
              <ul className="space-y-3">
                {requests?.requests.map((r) => (
                  <li key={r.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{r.title}</p>
                        <p className="mt-1 text-sm text-gray-600">{r.description}</p>
                        <p className="mt-2 text-xs text-gray-400">{formatDate(r.createdAt)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline">{r.status}</Badge>
                        <Badge variant="warning">{r.priority}</Badge>
                      </div>
                    </div>
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
