'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PortalShell } from '@/components/layout/portal-shell';
import { ClassifiedsList } from '@/components/classifieds/classifieds-list';
import { api } from '@/lib/api';

export default function PortalClassifiedsPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ currentTenant: { role: string } | null }>('/api/auth/me'),
  });

  const role = me?.currentTenant?.role;

  return (
    <PortalShell slug={slug} role={role}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Classifieds</h1>
        <p className="mt-1 text-sm text-gray-500">
          Browse community listings from your neighbors.
        </p>
      </div>

      <ClassifiedsList slug={slug} postHref={`/t/${slug}/portal/classifieds/new`} />
    </PortalShell>
  );
}
