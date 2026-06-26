'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PortalNav } from '@/components/layout/header';
import { UpsellBanner } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api, tenantApi, formatDate } from '@/lib/api';

export default function AdminBlastsPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;
  const qc = useQueryClient();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [testSend, setTestSend] = useState(true);
  const [error, setError] = useState('');

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ currentTenant: { role: string; plan: string } | null; tenants: Array<{ tenant: { plan: string } }> }>('/api/auth/me'),
  });

  const { data: tenant } = useQuery({
    queryKey: ['tenant', slug],
    queryFn: () => api<{ plan: string }>(`/api/tenants/${slug}`),
  });

  const { data: blasts } = useQuery({
    queryKey: ['blasts', slug],
    queryFn: () => tenantApi<{ blasts: Array<{ id: string; subject: string; sentCount: number; failureCount: number; status: string; createdAt: string }> }>(slug, '/blasts'),
    enabled: tenant?.plan !== 'FREE',
  });

  const plan = tenant?.plan ?? 'FREE';
  const canBlast = plan !== 'FREE';

  async function sendBlast(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await tenantApi(slug, '/blasts', {
        method: 'POST',
        body: JSON.stringify({ subject, body, audience: 'ALL', testSendToMe: testSend }),
      });
      setSubject('');
      setBody('');
      qc.invalidateQueries({ queryKey: ['blasts', slug] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
    }
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-white p-4">
        <PortalNav slug={slug} role={me?.currentTenant?.role} />
      </aside>
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold">Blast Center</h1>

        {!canBlast && <div className="mt-4"><UpsellBanner feature="Email blasts" plan={plan} /></div>}

        {canBlast && (
          <>
            <Card className="mt-6">
              <CardHeader><CardTitle>Compose Blast</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={sendBlast} className="space-y-4">
                  <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
                  <Textarea placeholder="Body (HTML)" value={body} onChange={(e) => setBody(e.target.value)} required rows={6} />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={testSend} onChange={(e) => setTestSend(e.target.checked)} />
                    Test send to me first
                  </label>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <Button type="submit">Send Blast</Button>
                </form>
              </CardContent>
            </Card>

            <div className="mt-8">
              <h2 className="font-semibold">Blast History</h2>
              <div className="mt-4 space-y-2">
                {(blasts?.blasts ?? []).map((b) => (
                  <div key={b.id} className="rounded border p-3 text-sm">
                    <strong>{b.subject}</strong>
                    <span className="ml-2 text-gray-500">{formatDate(b.createdAt)}</span>
                    <p className="text-gray-600">Sent: {b.sentCount} · Failures: {b.failureCount} · {b.status}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
