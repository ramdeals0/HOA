'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PortalNav } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { tenantApi } from '@/lib/api';

export default function NewClassifiedPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.tenantSlug as string;
  const [form, setForm] = useState({ title: '', description: '', category: 'General', priceCents: '', contactEmail: '' });
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await tenantApi(slug, '/classifieds', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          priceCents: form.priceCents ? Math.round(parseFloat(form.priceCents) * 100) : undefined,
        }),
      });
      router.push(`/t/${slug}/portal`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    }
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-white p-4">
        <PortalNav slug={slug} />
      </aside>
      <main className="flex-1 p-8">
        <Card className="max-w-lg">
          <CardHeader><CardTitle>Post Classified</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-gray-500">Your listing will be pending board approval.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              <Input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              <Input type="number" placeholder="Price ($)" value={form.priceCents} onChange={(e) => setForm({ ...form, priceCents: e.target.value })} />
              <Input type="email" placeholder="Contact email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit">Submit for Approval</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
