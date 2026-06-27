'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/layout/header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { api } from '@/lib/api';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    slug: '',
    primaryContactEmail: '',
    adminEmail: '',
    adminPassword: '',
    adminFirstName: '',
    adminLastName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (field === 'name' && !form.slug) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setForm((f) => ({ ...f, slug }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await api<{ tenant: { slug: string } }>('/api/tenants/signup', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      router.push(`/t/${result.tenant.slug}/onboarding`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SiteHeader />
      <div className="mx-auto max-w-lg flex-1 px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Start your HOA</CardTitle>
            <CardDescription>Create your community portal in minutes</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input placeholder="HOA Name" value={form.name} onChange={(e) => update('name', e.target.value)} required />
              <Input placeholder="URL slug (e.g. whisper-groves)" value={form.slug} onChange={(e) => update('slug', e.target.value)} required />
              <Input type="email" placeholder="Primary contact email" value={form.primaryContactEmail} onChange={(e) => update('primaryContactEmail', e.target.value)} required />
              <hr />
              <p className="text-sm font-medium text-gray-700">Board admin account</p>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="First name" value={form.adminFirstName} onChange={(e) => update('adminFirstName', e.target.value)} required />
                <Input placeholder="Last name" value={form.adminLastName} onChange={(e) => update('adminLastName', e.target.value)} required />
              </div>
              <Input type="email" placeholder="Admin email" value={form.adminEmail} onChange={(e) => update('adminEmail', e.target.value)} required />
              <Input type="password" placeholder="Admin password" value={form.adminPassword} onChange={(e) => update('adminPassword', e.target.value)} required minLength={8} />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating...' : 'Create HOA'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <SiteFooter />
    </div>
  );
}
