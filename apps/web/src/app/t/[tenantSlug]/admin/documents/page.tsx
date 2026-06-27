'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PortalNav } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { api, tenantApi } from '@/lib/api';

const VISIBILITY_OPTIONS = ['PUBLIC', 'MEMBERS', 'BOARD', 'FINANCIAL'] as const;

export default function AdminDocumentsPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [visibility, setVisibility] = useState<(typeof VISIBILITY_OPTIONS)[number]>('PUBLIC');
  const [error, setError] = useState('');

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ currentTenant: { role: string } | null }>('/api/auth/me'),
  });

  const { data, isLoading, isError, error: loadError } = useQuery({
    queryKey: ['admin-documents', slug],
    queryFn: () =>
      tenantApi<{
        documents: Array<{
          id: string;
          title: string;
          description: string | null;
          fileUrl: string;
          visibility: string;
        }>;
      }>(slug, '/documents'),
  });

  async function createDocument(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await tenantApi(slug, '/documents', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: description || undefined,
          fileUrl,
          visibility,
        }),
      });
      setTitle('');
      setDescription('');
      setFileUrl('');
      setVisibility('PUBLIC');
      qc.invalidateQueries({ queryKey: ['admin-documents', slug] });
      qc.invalidateQueries({ queryKey: ['documents', slug] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document');
    }
  }

  async function deleteDocument(id: string) {
    setError('');
    try {
      await tenantApi(slug, `/documents/${id}`, { method: 'DELETE' });
      qc.invalidateQueries({ queryKey: ['admin-documents', slug] });
      qc.invalidateQueries({ queryKey: ['documents', slug] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-white p-4">
        <PortalNav slug={slug} role={me?.currentTenant?.role} />
      </aside>
      <main className="flex-1 p-4 sm:p-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Document Management</h1>
        <p className="mt-1 text-sm text-gray-500">Upload and manage community documents</p>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Add Document</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createDocument} className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <Input
                placeholder="File URL (https://...)"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                required
              />
              <select
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm md:col-span-2"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as (typeof VISIBILITY_OPTIONS)[number])}
              >
                {VISIBILITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <Textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="md:col-span-2"
              />
              <div className="md:col-span-2">
                <Button type="submit">Publish document</Button>
              </div>
            </form>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Existing Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && <p className="text-sm text-gray-500">Loading documents...</p>}
            {isError && (
              <p className="text-sm text-red-600">
                {loadError instanceof Error ? loadError.message : 'Unable to load documents'}
              </p>
            )}
            {(data?.documents ?? []).length === 0 && !isLoading && !isError ? (
              <p className="text-sm text-gray-500">No documents uploaded yet.</p>
            ) : (
              <ul className="divide-y">
                {(data?.documents ?? []).map((doc) => (
                  <li key={doc.id} className="flex flex-wrap items-start justify-between gap-4 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{doc.title}</p>
                        <Badge variant="outline">{doc.visibility}</Badge>
                      </div>
                      {doc.description && <p className="mt-1 text-sm text-gray-500">{doc.description}</p>}
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                      >
                        Open file
                      </a>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => deleteDocument(doc.id)}>
                      Delete
                    </Button>
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
