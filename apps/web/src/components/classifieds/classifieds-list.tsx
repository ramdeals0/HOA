'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { tenantApi, formatCurrency } from '@/lib/api';

export type ClassifiedListing = {
  id: string;
  title: string;
  description: string;
  category: string;
  priceCents: number | null;
  contactEmail: string | null;
  author: { firstName: string; lastName: string };
};

export function ClassifiedsList({
  slug,
  limit,
  postHref,
}: {
  slug: string;
  limit?: number;
  postHref?: string;
}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState<ClassifiedListing | null>(null);

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['classifieds', slug, search, category],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (search) qs.set('search', search);
      if (category) qs.set('category', category);
      return tenantApi<{ listings: ClassifiedListing[] }>(slug, `/classifieds?${qs}`);
    },
  });

  const listings = limit ? (data?.listings ?? []).slice(0, limit) : (data?.listings ?? []);
  const categories = [...new Set((data?.listings ?? []).map((l) => l.category))];
  const showFilters = limit == null;

  return (
    <>
      {showFilters && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          {postHref && (
            <Link href={postHref}>
              <Button className="w-full sm:w-auto">Post a classified</Button>
            </Link>
          )}
        </div>
      )}

      {isLoading && <p className="text-gray-500">Loading classifieds...</p>}
      {isError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error instanceof Error ? error.message : 'Unable to load classifieds right now.'}
        </p>
      )}

      {!isLoading && !isError && listings.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-gray-500">
            No classified listings yet.
            {postHref && (
              <div className="mt-4">
                <Link href={postHref}>
                  <Button variant="outline">Post the first one</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className={`grid gap-4 ${showFilters ? 'md:grid-cols-2' : ''}`}>
        {listings.map((listing) => (
          <Card
            key={listing.id}
            className="cursor-pointer hover:shadow-md"
            onClick={() => setSelected(listing)}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-lg">{listing.title}</CardTitle>
                <Badge variant="outline" className="shrink-0">
                  {listing.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-2 text-sm text-gray-600">{listing.description}</p>
              {listing.priceCents != null && (
                <p className="mt-2 font-semibold">{formatCurrency(listing.priceCents)}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-lg rounded-t-lg bg-white p-6 sm:rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold">{selected.title}</h2>
            <Badge className="mt-2" variant="outline">
              {selected.category}
            </Badge>
            <p className="mt-4 text-gray-700">{selected.description}</p>
            {selected.priceCents != null && (
              <p className="mt-2 text-lg font-semibold">{formatCurrency(selected.priceCents)}</p>
            )}
            {selected.contactEmail && <p className="mt-4 text-sm">Contact: {selected.contactEmail}</p>}
            <p className="mt-2 text-sm text-gray-500">
              Posted by {selected.author.firstName} {selected.author.lastName}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
