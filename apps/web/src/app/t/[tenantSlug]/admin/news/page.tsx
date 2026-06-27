'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PortalNav } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api, tenantApi, formatDate } from '@/lib/api';
import { CONTENT_RETENTION_NOTICE, formatContentExpiryLabel } from '@/lib/content-retention';

type NewsPost = {
  id: string;
  title: string;
  body: string;
  isPublic: boolean;
  createdAt: string;
};

export default function AdminNewsPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(true);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ currentTenant: { role: string } | null }>('/api/auth/me'),
  });

  const { data } = useQuery({
    queryKey: ['admin-news', slug],
    queryFn: () => tenantApi<{ posts: NewsPost[] }>(slug, '/news'),
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
    qc.invalidateQueries({ queryKey: ['news', slug] });
  }

  function startEdit(post: NewsPost) {
    setEditingId(post.id);
    setEditTitle(post.title);
    setEditBody(post.body);
    setEditIsPublic(post.isPublic);
  }

  async function saveEdit(postId: string) {
    await tenantApi(slug, `/news/${postId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: editTitle,
        body: editBody,
        isPublic: editIsPublic,
        isPublished: true,
      }),
    });
    setEditingId(null);
    qc.invalidateQueries({ queryKey: ['admin-news', slug] });
    qc.invalidateQueries({ queryKey: ['news', slug] });
  }

  async function removePost(postId: string) {
    if (!window.confirm('Remove this news post?')) {
      return;
    }

    await tenantApi(slug, `/news/${postId}`, { method: 'DELETE' });
    if (editingId === postId) {
      setEditingId(null);
    }
    qc.invalidateQueries({ queryKey: ['admin-news', slug] });
    qc.invalidateQueries({ queryKey: ['news', slug] });
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-white p-4">
        <PortalNav slug={slug} role={me?.currentTenant?.role} />
      </aside>
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold">News Management</h1>
        <p className="mt-2 text-sm text-gray-500">{CONTENT_RETENTION_NOTICE}</p>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Create Post</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createPost} className="space-y-4">
              <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <Textarea
                placeholder="Body (HTML supported)"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                rows={5}
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                Public post
              </label>
              <Button type="submit">Publish</Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 space-y-4">
          <h2 className="font-semibold">Existing Posts</h2>
          {(data?.posts ?? []).map((post) => (
            <Card key={post.id}>
              <CardContent className="space-y-4 pt-6">
                {editingId === post.id ? (
                  <>
                    <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                    <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={5} />
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editIsPublic}
                        onChange={(e) => setEditIsPublic(e.target.checked)}
                      />
                      Public post
                    </label>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(post.id)}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h3 className="font-medium">{post.title}</h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {post.isPublic ? 'Public' : 'Members only'} · Posted {formatDate(post.createdAt)} ·{' '}
                        {formatContentExpiryLabel(post.createdAt)}
                      </p>
                    </div>
                    <div className="prose max-w-none text-sm" dangerouslySetInnerHTML={{ __html: post.body }} />
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(post)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => removePost(post.id)}>
                        Remove
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
