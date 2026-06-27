'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PortalShell } from '@/components/layout/portal-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api, tenantApi } from '@/lib/api';
import {
  resolutionStatusLabel,
  resolutionStatusVariant,
  resolutionTypeLabel,
  type ResolutionSummary,
} from '@/lib/resolutions';

function ResultBars({
  results,
}: {
  results: NonNullable<ResolutionSummary['results']>;
}) {
  return (
    <div className="space-y-3">
      {results.map((result) => (
        <div key={result.optionId}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span>{result.label}</span>
            <span className="font-medium">
              {result.count} ({result.percentage}%)
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-blue-600 transition-all"
              style={{ width: `${result.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function VotingCard({
  slug,
  resolution,
  onVoted,
}: {
  slug: string;
  resolution: ResolutionSummary;
  onVoted: () => void;
}) {
  const [selectedOptionId, setSelectedOptionId] = useState(resolution.userVote?.optionId ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submitVote() {
    if (!selectedOptionId) {
      setError('Select an option to vote.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await tenantApi(slug, `/resolutions/${resolution.id}/vote`, {
        method: 'POST',
        body: JSON.stringify({ optionId: selectedOptionId }),
      });
      onVoted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit vote.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{resolution.title}</CardTitle>
            <CardDescription className="mt-1">
              {resolutionTypeLabel(resolution.type)} · {resolution.voteCount} vote
              {resolution.voteCount === 1 ? '' : 's'}
            </CardDescription>
          </div>
          <Badge variant={resolutionStatusVariant(resolution.status)}>
            {resolutionStatusLabel(resolution.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {resolution.description && <p className="text-sm text-gray-700">{resolution.description}</p>}

        {resolution.votingOpen && (
          <div className="space-y-3 rounded-lg border bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-900">
              {resolution.userVote ? 'Change your vote' : 'Cast your vote'}
            </p>
            <div className="space-y-2">
              {resolution.options.map((option) => (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md border bg-white px-3 py-2 text-sm"
                >
                  <input
                    type="radio"
                    name={`vote-${resolution.id}`}
                    value={option.id}
                    checked={selectedOptionId === option.id}
                    onChange={() => setSelectedOptionId(option.id)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button size="sm" disabled={submitting} onClick={submitVote}>
              {resolution.userVote ? 'Update vote' : 'Submit vote'}
            </Button>
          </div>
        )}

        {resolution.userVote && !resolution.votingOpen && (
          <p className="text-sm text-gray-600">
            You voted for{' '}
            <span className="font-medium">
              {resolution.options.find((option) => option.id === resolution.userVote?.optionId)?.label}
            </span>
            .
          </p>
        )}

        {resolution.results && <ResultBars results={resolution.results} />}
      </CardContent>
    </Card>
  );
}

export default function PortalVotingPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;
  const qc = useQueryClient();

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ currentTenant: { role: string } | null }>('/api/auth/me'),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['resolutions', slug],
    queryFn: () => tenantApi<{ resolutions: ResolutionSummary[] }>(slug, '/resolutions'),
  });

  const resolutions = data?.resolutions ?? [];
  const openItems = resolutions.filter((item) => item.status === 'OPEN');
  const closedItems = resolutions.filter((item) => item.status === 'CLOSED');

  function refresh() {
    qc.invalidateQueries({ queryKey: ['resolutions', slug] });
  }

  return (
    <PortalShell slug={slug} role={me?.currentTenant?.role}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Community Voting</h1>
        <p className="mt-1 text-sm text-gray-500">
          Vote on board resolutions and share your viewpoint on community topics.
        </p>
      </div>

      {isLoading && <p className="text-gray-500">Loading voting items...</p>}

      {!isLoading && resolutions.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-gray-500">
            No voting items are available right now.
          </CardContent>
        </Card>
      )}

      {openItems.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Open for voting</h2>
          {openItems.map((resolution) => (
            <VotingCard key={resolution.id} slug={slug} resolution={resolution} onVoted={refresh} />
          ))}
        </section>
      )}

      {closedItems.length > 0 && (
        <section className={`space-y-4 ${openItems.length > 0 ? 'mt-8' : ''}`}>
          <h2 className="text-lg font-semibold">Past results</h2>
          {closedItems.map((resolution) => (
            <VotingCard key={resolution.id} slug={slug} resolution={resolution} onVoted={refresh} />
          ))}
        </section>
      )}
    </PortalShell>
  );
}
