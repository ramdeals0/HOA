'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { TenantHeader } from '@/components/layout/header';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { tenantApi, formatCurrency } from '@/lib/api';

export default function ClassifiedsPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState<{
    id: string;
    title: string;
    description: string;
    category: string;
    priceCents: number | null;
    contactEmail: string | null;
    author: { firstName: string; lastName: string };
  } | null>(null);

  const { data } = useQuery({
    queryKey: ['classifieds', slug, search, category],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (search) qs.set('search', search);
      if (category) qs.set('category', category);
      return tenantApi<{ listings: Array<{
        id: string;
        title: string;
        description: string;
        category: string;
        priceCents: number | null;
        contactEmail: string | null;
        author: { firstName: string; lastName: string };
      }> }>(slug, `/classifieds?${qs}`);
    },
  });

  const listings = data?.listings ?? [];
  const categories = [...new Set(listings.map((l) => l.category))];

  return (
    <div className="min-h-screen bg-gray-50">
      <TenantHeader slug={slug} name="Classifieds" />
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-6 text-3xl font-bold">Community Classifieds</h1>
        <div className="mb-6 flex gap-4">
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-gray-300 px-3 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {listings.map((listing) => (
            <Card key={listing.id} className="cursor-pointer hover:shadow-md" onClick={() => setSelected(listing)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{listing.title}</CardTitle>
                  <Badge variant="outline">{listing.category}</Badge>
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
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setSelected(null)}>
            <div className="w-full max-w-lg rounded-t-lg bg-white p-6 sm:rounded-lg" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold">{selected.title}</h2>
              <Badge className="mt-2" variant="outline">{selected.category}</Badge>
              <p className="mt-4 text-gray-700">{selected.description}</p>
              {selected.priceCents != null && <p className="mt-2 text-lg font-semibold">{formatCurrency(selected.priceCents)}</p>}
              {selected.contactEmail && <p className="mt-4 text-sm">Contact: {selected.contactEmail}</p>}
              <p className="mt-2 text-sm text-gray-500">Posted by {selected.author.firstName} {selected.author.lastName}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
