'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SiteFooter } from '@/components/layout/site-footer';
import { api } from '@/lib/api';
import { getSafeRedirectPath } from '@/lib/auth-routes';
import { switchTenantSession } from '@/lib/switch-tenant';
import { tenantPortalPath } from '@/lib/session-token';

const VILLA_IMAGE =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1920&q=80';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = getSafeRedirectPath(searchParams.get('redirect'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [tenants, setTenants] = useState<
    Array<{ tenantId: string; tenantName: string; tenantSlug: string; role: string }>
  >([]);
  const [showTenantPicker, setShowTenantPicker] = useState(false);
  const [selectingTenantId, setSelectingTenantId] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const result = await api<{
        autoSelected: boolean;
        selectedTenant?: { slug: string };
        user: { isPlatformOwner?: boolean };
        tenants: Array<{ tenantId: string; tenantName: string; tenantSlug: string; role: string }>;
      }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (result.autoSelected && result.selectedTenant) {
        window.location.assign(tenantPortalPath(result.selectedTenant.slug, redirectPath));
        return;
      }

      if (result.tenants.length === 0) {
        if (result.user.isPlatformOwner) {
          window.location.assign('/saas-admin');
          return;
        }
        router.push('/signup');
        return;
      }

      if (result.tenants.length === 1) {
        await switchTenantSession(result.tenants[0].tenantId, result.tenants[0].tenantSlug, redirectPath);
        return;
      }

      setTenants(result.tenants);
      setShowTenantPicker(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  async function selectTenant(tenantId: string, slug: string) {
    setSelectingTenantId(tenantId);
    setError('');
    try {
      await switchTenantSession(tenantId, slug, redirectPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to select community.');
      setSelectingTenantId(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        <div className="relative hidden w-1/2 lg:block">
          <Image
            src={VILLA_IMAGE}
            alt="Beachfront villa at sunset"
            fill
            priority
            className="object-cover"
            sizes="50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
          <div className="absolute inset-0 flex flex-col justify-end p-12 text-white">
            <p className="text-sm font-medium uppercase tracking-widest text-white/80">
              HOA Portal SaaS
            </p>
            <h1 className="mt-3 max-w-md text-4xl font-bold leading-tight">
              Your community, beautifully managed
            </h1>
            <p className="mt-4 max-w-sm text-lg text-white/85">
              Access dues, news, documents, and neighbor services from one serene place.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col bg-gray-50 lg:w-1/2">
          <div className="flex items-center justify-between px-6 py-5 lg:px-12">
            <Link href="/" className="text-lg font-bold text-blue-600">
              HOA Portal SaaS
            </Link>
            <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
              Privacy
            </Link>
            <Link href="/signup" className="text-sm text-gray-600 hover:text-gray-900">
              Start your HOA
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center px-6 pb-12 lg:px-12">
            <div className="w-full max-w-md">
              <div className="relative mb-8 h-40 overflow-hidden rounded-2xl lg:hidden">
                <Image
                  src={VILLA_IMAGE}
                  alt="Beachfront villa"
                  fill
                  priority
                  className="object-cover"
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <p className="absolute bottom-4 left-4 text-lg font-semibold text-white">
                  Welcome back
                </p>
              </div>

              <Card className="border-0 shadow-lg shadow-blue-900/5">
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-2xl">Sign in</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your community portal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!showTenantPicker ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium text-gray-700">
                          Password
                        </label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-11"
                        />
                      </div>
                      {error && <p className="text-sm text-red-600">{error}</p>}
                      <Button type="submit" className="h-11 w-full text-base">
                        Sign in
                      </Button>
                    </form>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-900">Choose your association</p>
                      <p className="text-sm text-gray-600">
                        This account belongs to more than one HOA. Select which community to open.
                      </p>
                      {tenants.map((t) => (
                        <button
                          key={t.tenantId}
                          type="button"
                          disabled={selectingTenantId === t.tenantId}
                          onClick={() => selectTenant(t.tenantId, t.tenantSlug)}
                          className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50 disabled:opacity-60"
                        >
                          <span className="font-medium">{t.tenantName}</span>
                          <span className="text-sm text-gray-500">
                            {selectingTenantId === t.tenantId ? 'Opening...' : t.role}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="mt-6 text-center text-sm text-gray-500">
                    New HOA?{' '}
                    <Link href="/signup" className="font-medium text-blue-600 hover:underline">
                      Create your community
                    </Link>
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
