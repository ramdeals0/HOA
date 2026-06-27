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
import {
  resolutionStatusLabel,
  resolutionStatusVariant,
  resolutionTypeLabel,
  type ResolutionSummary,
} from '@/lib/resolutions';

const RESOLUTION_TYPES = ['RESOLUTION', 'VIEWPOINT'] as const;

export default function AdminVotingPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<(typeof RESOLUTION_TYPES)[number]>('RESOLUTION');
  const [optionOne, setOptionOne] = useState('Yes');
  const [optionTwo, setOptionTwo] = useState('No');
  const [optionThree, setOptionThree] = useState('');
  const [opensAt, setOpensAt] = useState('');
  const [closesAt, setClosesAt] = useState('');
  const [error, setError] = useState('');

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ currentTenant: { role: string } | null }>('/api/auth/me'),
  });

  const { data } = useQuery({
    queryKey: ['resolutions', slug],
    queryFn: () => tenantApi<{ resolutions: ResolutionSummary[] }>(slug, '/resolutions'),
  });

  async function createResolution(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    const options = [optionOne, optionTwo, optionThree]
      .map((label) => label.trim())
      .filter(Boolean)
      .map((label) => ({ label }));

    if (options.length < 2) {
      setError('At least two response options are required.');
      return;
    }

    try {
      await tenantApi(slug, '/resolutions', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: description || undefined,
          type,
          options,
          opensAt: opensAt ? new Date(opensAt).toISOString() : undefined,
          closesAt: closesAt ? new Date(closesAt).toISOString() : undefined,
        }),
      });
      setTitle('');
      setDescription('');
      setType('RESOLUTION');
      setOptionOne('Yes');
      setOptionTwo('No');
      setOptionThree('');
      setOpensAt('');
      setClosesAt('');
      qc.invalidateQueries({ queryKey: ['resolutions', slug] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create voting item.');
    }
  }

  async function openResolution(id: string) {
    await tenantApi(slug, `/resolutions/${id}/open`, { method: 'PATCH' });
    qc.invalidateQueries({ queryKey: ['resolutions', slug] });
  }

  async function closeResolution(id: string) {
    await tenantApi(slug, `/resolutions/${id}/close`, { method: 'PATCH' });
    qc.invalidateQueries({ queryKey: ['resolutions', slug] });
  }

  const resolutions = data?.resolutions ?? [];

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-white p-4">
        <PortalNav slug={slug} role={me?.currentTenant?.role} />
      </aside>
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold">Resolutions & Polls</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create board resolutions or community viewpoint polls for member voting.
        </p>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Create voting item</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createResolution} className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <select
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                value={type}
                onChange={(e) => setType(e.target.value as (typeof RESOLUTION_TYPES)[number])}
              >
                {RESOLUTION_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {resolutionTypeLabel(item)}
                  </option>
                ))}
              </select>
              <Textarea
                placeholder="Description or background for voters"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="md:col-span-2"
              />
              <Input placeholder="Option 1" value={optionOne} onChange={(e) => setOptionOne(e.target.value)} required />
              <Input placeholder="Option 2" value={optionTwo} onChange={(e) => setOptionTwo(e.target.value)} required />
              <Input
                placeholder="Option 3 (optional)"
                value={optionThree}
                onChange={(e) => setOptionThree(e.target.value)}
                className="md:col-span-2"
              />
              <Input
                type="datetime-local"
                value={opensAt}
                onChange={(e) => setOpensAt(e.target.value)}
                aria-label="Opens at"
              />
              <Input
                type="datetime-local"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
                aria-label="Closes at"
              />
              {error && (
                <p className="text-sm text-red-600 md:col-span-2">{error}</p>
              )}
              <div className="md:col-span-2">
                <Button type="submit">Save as draft</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>All voting items</CardTitle>
          </CardHeader>
          <CardContent>
            {resolutions.length === 0 ? (
              <p className="text-sm text-gray-500">No resolutions or polls yet.</p>
            ) : (
              <ul className="divide-y">
                {resolutions.map((resolution) => (
                  <li key={resolution.id} className="flex flex-wrap items-start justify-between gap-4 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{resolution.title}</p>
                        <Badge variant="outline">{resolutionTypeLabel(resolution.type)}</Badge>
                        <Badge variant={resolutionStatusVariant(resolution.status)}>
                          {resolutionStatusLabel(resolution.status)}
                        </Badge>
                      </div>
                      {resolution.description && (
                        <p className="mt-2 text-sm text-gray-600">{resolution.description}</p>
                      )}
                      <p className="mt-2 text-xs text-gray-500">
                        {resolution.voteCount} vote{resolution.voteCount === 1 ? '' : 's'} · Options:{' '}
                        {resolution.options.map((option) => option.label).join(', ')}
                      </p>
                      {resolution.results && (
                        <div className="mt-3 space-y-1">
                          {resolution.results.map((result) => (
                            <p key={result.optionId} className="text-xs text-gray-600">
                              {result.label}: {result.count} ({result.percentage}%)
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {resolution.status === 'DRAFT' && (
                        <Button size="sm" onClick={() => openResolution(resolution.id)}>
                          Open voting
                        </Button>
                      )}
                      {resolution.status === 'OPEN' && (
                        <Button size="sm" variant="outline" onClick={() => closeResolution(resolution.id)}>
                          Close voting
                        </Button>
                      )}
                    </div>
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
