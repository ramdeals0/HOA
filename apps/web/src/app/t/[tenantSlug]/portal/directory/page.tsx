'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { PortalNav } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, tenantApi } from '@/lib/api';

type DirectoryEntry = {
  id: string;
  displayName: string;
  email?: string;
  phone?: string;
  address?: { street: string; lot?: string | null };
  photoUrl?: string;
};

function ResidentCard({
  resident,
  onMessage,
}: {
  resident: DirectoryEntry;
  onMessage: (resident: DirectoryEntry) => void;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {resident.photoUrl ? (
            <img
              src={resident.photoUrl}
              alt={resident.displayName}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-700">
              {resident.displayName
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-gray-900">{resident.displayName}</h2>
            {resident.address && (
              <p className="mt-1 text-sm text-gray-600">
                {resident.address.street}
                {resident.address.lot ? ` · Lot ${resident.address.lot}` : ''}
              </p>
            )}
            {resident.email && (
              <a href={`mailto:${resident.email}`} className="mt-2 block text-sm text-blue-600 hover:underline">
                {resident.email}
              </a>
            )}
            {resident.phone && <p className="mt-1 text-sm text-gray-600">{resident.phone}</p>}
            {!resident.email && (
              <Button variant="outline" size="sm" className="mt-3" onClick={() => onMessage(resident)}>
                Message via portal
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResidentDirectoryPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;
  const [search, setSearch] = useState('');
  const [messageTarget, setMessageTarget] = useState<DirectoryEntry | null>(null);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ currentTenant: { role: string } | null; user: { id: string } }>('/api/auth/me'),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['directory', slug],
    queryFn: () => tenantApi<{ residents: DirectoryEntry[] }>(slug, '/directory'),
  });

  const filteredResidents = useMemo(() => {
    const query = search.trim().toLowerCase();
    const residents = (data?.residents ?? []).filter((resident) => resident.id !== me?.user?.id);

    if (!query) return residents;

    return residents.filter((resident) => {
      const address = resident.address
        ? `${resident.address.street} ${resident.address.lot ?? ''}`.toLowerCase()
        : '';
      return (
        resident.displayName.toLowerCase().includes(query) ||
        address.includes(query) ||
        (resident.email?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [data?.residents, me?.user?.id, search]);

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-white p-4">
        <PortalNav slug={slug} role={me?.currentTenant?.role} />
      </aside>
      <main className="flex-1 p-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Resident Directory</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              This directory only shows neighbors who have chosen to share their information with
              other logged-in members of your community.
            </p>
          </div>
          <Link href={`/t/${slug}/portal/settings`} className="text-sm text-blue-600 hover:underline">
            Manage my directory privacy
          </Link>
        </div>

        <div className="mb-6 max-w-md">
          <Input
            placeholder="Search by name or address"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {isLoading && <p className="text-gray-500">Loading directory...</p>}
        {error && (
          <p className="text-red-600">
            {error instanceof Error ? error.message : 'Failed to load resident directory'}
          </p>
        )}

        {!isLoading && !error && filteredResidents.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-gray-500">
              {search
                ? 'No residents match your search.'
                : 'No neighbors have opted into the directory yet.'}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredResidents.map((resident) => (
            <ResidentCard key={resident.id} resident={resident} onMessage={setMessageTarget} />
          ))}
        </div>

        {messageTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h2 className="text-lg font-semibold">Message via portal</h2>
              <p className="mt-3 text-sm text-gray-600">
                This will send {messageTarget.displayName} an email without sharing their address
                with you.
              </p>
              <p className="mt-2 text-xs text-gray-500">Portal messaging backend coming soon.</p>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setMessageTarget(null)}>
                  Close
                </Button>
                <Button onClick={() => setMessageTarget(null)}>Send message</Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
