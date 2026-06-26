'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PortalNav } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api, tenantApi } from '@/lib/api';

export default function AccountPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;
  const qc = useQueryClient();

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ currentTenant: { role: string } | null }>('/api/auth/me'),
  });

  const { data: account, isLoading, error } = useQuery({
    queryKey: ['account', slug],
    queryFn: () =>
      tenantApi<{
        user: { id: string; email: string; firstName: string; lastName: string; phone: string | null };
        properties: Array<{ id: string; street: string; lotNumber: string | null; city: string; state: string; zip: string }>;
        membership: { role: string; status: string } | null;
      }>(slug, '/account'),
  });

  const [phone, setPhone] = useState('');
  const [emailNews, setEmailNews] = useState(true);
  const [emailDues, setEmailDues] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (account?.user) {
      setPhone(account.user.phone ?? '');
    }
  }, [account?.user]);

  const user = account?.user;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError('');
    setSaved(false);
    try {
      await tenantApi(slug, '/account', {
        method: 'PATCH',
        body: JSON.stringify({ phone: phone || null }),
      });
      setSaved(true);
      qc.invalidateQueries({ queryKey: ['account', slug] });
      qc.invalidateQueries({ queryKey: ['me'] });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    }
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-white p-4">
        <PortalNav slug={slug} role={me?.currentTenant?.role} />
      </aside>
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold">My Account</h1>

        {isLoading && <p className="mt-4 text-gray-500">Loading...</p>}
        {error && (
          <p className="mt-4 text-red-600">
            {error instanceof Error ? error.message : 'Failed to load account'}
          </p>
        )}

        {user && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your member information for this community</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm">
                      {user.firstName} {user.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Role</label>
                    <div className="mt-1">
                      <Badge variant="outline">{account?.membership?.role ?? 'MEMBER'}</Badge>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <Input
                      id="phone"
                      className="mt-1"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 555-5555"
                    />
                  </div>
                  {saveError && <p className="text-sm text-red-600">{saveError}</p>}
                  {saved && <p className="text-sm text-green-600">Profile updated.</p>}
                  <Button type="submit">Save changes</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Properties</CardTitle>
                <CardDescription>Homes linked to your membership</CardDescription>
              </CardHeader>
              <CardContent>
                {(account?.properties ?? []).length === 0 ? (
                  <p className="text-sm text-gray-500">No properties linked to your account yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {account?.properties.map((p) => (
                      <li key={p.id} className="rounded-lg border p-3 text-sm">
                        <p className="font-medium">{p.street}</p>
                        {p.lotNumber && <p className="text-gray-500">Lot {p.lotNumber}</p>}
                        <p className="text-gray-500">
                          {[p.city, p.state, p.zip].filter(Boolean).join(', ')}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Notification preferences</CardTitle>
                <CardDescription>Choose what emails you receive (saved locally for now)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={emailNews}
                    onChange={(e) => setEmailNews(e.target.checked)}
                  />
                  Community news and announcements
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={emailDues}
                    onChange={(e) => setEmailDues(e.target.checked)}
                  />
                  Dues reminders and payment receipts
                </label>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
