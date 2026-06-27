'use client';

import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api, formatCurrency, tenantApi } from '@/lib/api';
import { formatContentExpiryLabel } from '@/lib/content-retention';
import type { ClassifiedListing } from '@/components/classifieds/classifieds-list';

export function MyClassifiedsPanel({ slug }: { slug: string }) {
  const qc = useQueryClient();

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ user: { id: string }; currentTenant: { role: string } | null }>('/api/auth/me'),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['my-classifieds', slug],
    enabled: Boolean(me?.user.id),
    queryFn: () =>
      tenantApi<{ listings: Array<ClassifiedListing & { status: string }> }>(slug, '/classifieds?mine=true'),
  });

  const listings = data?.listings ?? [];
  const isBoard = ['SUPER_ADMIN', 'BOARD'].includes(me?.currentTenant?.role ?? '');

  async function removeListing(id: string) {
    if (!window.confirm('Remove this classified listing?')) {
      return;
    }

    await tenantApi(slug, `/classifieds/${id}`, { method: 'DELETE' });
    await qc.invalidateQueries({ queryKey: ['my-classifieds', slug] });
    await qc.invalidateQueries({ queryKey: ['classifieds', slug] });
  }

  if (!me?.user.id || (!isLoading && listings.length === 0)) {
    return null;
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-lg">My Classifieds</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <p className="text-sm text-gray-500">Loading your listings...</p>}
        {listings.map((listing) => (
          <div key={listing.id} className="rounded-lg border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">{listing.title}</h3>
                  <Badge variant="outline">{listing.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-gray-600">{listing.description}</p>
                <p className="mt-2 text-xs text-gray-500">
                  {listing.category}
                  {listing.priceCents != null && ` · ${formatCurrency(listing.priceCents)}`}
                  {' · '}
                  {formatContentExpiryLabel(listing.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link href={`/t/${slug}/portal/classifieds/${listing.id}/edit`}>
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                </Link>
                <Button size="sm" variant="destructive" onClick={() => removeListing(listing.id)}>
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ))}
        {!isBoard && (
          <p className="text-xs text-gray-500">
            Editing a listing sends it back to the board for approval.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
