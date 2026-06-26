'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PortalNav } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api, tenantApi } from '@/lib/api';

export default function AdminNewsPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ currentTenant: { role: string } | null }>('/api/auth/me'),
  });

  const { data } = useQuery({
    queryKey: ['admin-news', slug],
    queryFn: () => tenantApi<{ posts: Array<{ id: string; title: string; isPublic: boolean }> }>(slug, '/news'),
  });

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    await tenantApi(slug, '/news', {
      method: 'POST',
      body: JSON.stringify({ title, body, isPublic, isPublished: true }),
    });
    setTitle('');
    setBody('');
    qc.invalidateQueries({ queryKey: ['admin-news', slug] });
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-white p-4">
        <PortalNav slug={slug} role={me?.currentTenant?.role} />
      </aside>
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold">News Management</h1>

        <Card className="mt-6">
          <CardHeader><CardTitle>Create Post</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={createPost} className="space-y-4">
              <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <Textarea placeholder="Body (HTML supported)" value={body} onChange={(e) => setBody(e.target.value)} required rows={5} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                Public post
              </label>
              <Button type="submit">Publish</Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 space-y-2">
          <h2 className="font-semibold">Existing Posts</h2>
          {(data?.posts ?? []).map((p) => (
            <div key={p.id} className="rounded border p-3 text-sm">
              {p.title} {p.isPublic ? '(public)' : '(members only)'}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
