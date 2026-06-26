'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [tenants, setTenants] = useState<
    Array<{ tenantId: string; tenantName: string; tenantSlug: string; role: string }>
  >([]);
  const [showTenantPicker, setShowTenantPicker] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const result = await api<{
        autoSelected: boolean;
        selectedTenant?: { slug: string };
        tenants: Array<{ tenantId: string; tenantName: string; tenantSlug: string; role: string }>;
      }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (result.autoSelected && result.selectedTenant) {
        router.push(`/t/${result.selectedTenant.slug}/portal`);
        return;
      }

      if (result.tenants.length === 0) {
        router.push('/signup');
        return;
      }

      if (result.tenants.length === 1) {
        await api('/api/auth/select-tenant', {
          method: 'POST',
          body: JSON.stringify({ tenantId: result.tenants[0].tenantId }),
        });
        router.push(`/t/${result.tenants[0].tenantSlug}/portal`);
        return;
      }

      setTenants(result.tenants);
      setShowTenantPicker(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  async function selectTenant(tenantId: string, slug: string) {
    await api('/api/auth/select-tenant', {
      method: 'POST',
      body: JSON.stringify({ tenantId }),
    });
    router.push(`/t/${slug}/portal`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <div className="mx-auto max-w-md px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
          </CardHeader>
          <CardContent>
            {!showTenantPicker ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full">
                  Sign in
                </Button>
              </form>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Choose your community:</p>
                {tenants.map((t) => (
                  <button
                    key={t.tenantId}
                    onClick={() => selectTenant(t.tenantId, t.tenantSlug)}
                    className="flex w-full items-center justify-between rounded-lg border p-4 text-left hover:bg-gray-50"
                  >
                    <span className="font-medium">{t.tenantName}</span>
                    <span className="text-sm text-gray-500">{t.role}</span>
                  </button>
                ))}
              </div>
            )}
            <p className="mt-4 text-center text-sm text-gray-500">
              <Link href="/signup" className="text-blue-600 hover:underline">
                Register a new HOA
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
