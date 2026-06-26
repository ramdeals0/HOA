'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/api';

export default function SaasAdminPage() {
  const qc = useQueryClient();

  const { data, error } = useQuery({
    queryKey: ['saas-tenants'],
    queryFn: () => api<{ tenants: Array<{
      id: string;
      name: string;
      slug: string;
      plan: string;
      isActive: boolean;
      propertyCount: number;
      memberCount: number;
      arBalanceCents: number;
      lastActiveAt: string;
      lastStripeEventAt: string | null;
      lastEmailSentAt: string | null;
    }> }>('/api/saas-admin/tenants'),
    retry: false,
  });

  async function updateTenant(id: string, updates: { plan?: string; isActive?: boolean }) {
    await api(`/api/saas-admin/tenants/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    qc.invalidateQueries({ queryKey: ['saas-tenants'] });
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">SaaS Admin</h1>
        <p className="mt-4 text-red-600">Access denied. Platform owner login required.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-bold">Platform Admin</h1>
      <p className="text-gray-600">Manage all HOA tenants</p>

      <div className="mt-8 space-y-4">
        {(data?.tenants ?? []).map((t) => (
          <Card key={t.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t.name}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant={t.isActive ? 'success' : 'destructive'}>{t.isActive ? 'Active' : 'Suspended'}</Badge>
                  <Badge variant="outline">{t.plan}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 text-sm md:grid-cols-4">
                <div><span className="text-gray-500">Slug:</span> /t/{t.slug}</div>
                <div><span className="text-gray-500">Properties:</span> {t.propertyCount}</div>
                <div><span className="text-gray-500">Members:</span> {t.memberCount}</div>
                <div><span className="text-gray-500">AR Balance:</span> {formatCurrency(t.arBalanceCents)}</div>
                <div><span className="text-gray-500">Last Active:</span> {formatDate(t.lastActiveAt)}</div>
                <div><span className="text-gray-500">Last Stripe:</span> {t.lastStripeEventAt ? formatDate(t.lastStripeEventAt) : '—'}</div>
                <div><span className="text-gray-500">Last Email:</span> {t.lastEmailSentAt ? formatDate(t.lastEmailSentAt) : '—'}</div>
              </div>
              <div className="mt-4 flex gap-2">
                {t.plan !== 'PRO' && <Button size="sm" variant="outline" onClick={() => updateTenant(t.id, { plan: 'PRO' })}>Upgrade to PRO</Button>}
                {t.plan !== 'ENTERPRISE' && <Button size="sm" variant="outline" onClick={() => updateTenant(t.id, { plan: 'ENTERPRISE' })}>Upgrade to Enterprise</Button>}
                <Button size="sm" variant={t.isActive ? 'destructive' : 'default'} onClick={() => updateTenant(t.id, { isActive: !t.isActive })}>
                  {t.isActive ? 'Suspend' : 'Reactivate'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
