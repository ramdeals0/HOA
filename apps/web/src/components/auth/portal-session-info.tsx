'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AuthMeResponse, formatRoleLabel, formatUserDisplayName } from '@/lib/auth-types';

export function PortalSessionInfo({ compact = false }: { compact?: boolean }) {
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<AuthMeResponse>('/api/auth/me'),
  });

  const userName = formatUserDisplayName(me?.user);
  const hoaName = me?.currentTenant?.name ?? 'Community Portal';
  const roleLabel = formatRoleLabel(me?.currentTenant?.role);
  const tenantCount = me?.tenants?.length ?? 0;

  if (compact) {
    return (
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Signed in</p>
        <p className="truncate text-sm font-semibold text-gray-900">{userName}</p>
        <p className="truncate text-xs text-gray-500">{hoaName}</p>
        <Link href="/select-community" className="mt-1 inline-block text-xs text-blue-600 hover:underline">
          Change community
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50/60 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-800">Signed in as</p>
      <p className="mt-1 font-medium text-gray-900">{userName}</p>
      {me?.user?.email && <p className="truncate text-xs text-gray-500">{me.user.email}</p>}

      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-blue-800">HOA Portal</p>
      <p className="mt-1 font-medium text-gray-900">{hoaName}</p>
      {roleLabel && <p className="text-xs text-gray-500">{roleLabel}</p>}

      <Link
        href="/select-community"
        className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline"
      >
        Change community{tenantCount > 1 ? ` (${tenantCount} available)` : ''}
      </Link>
    </div>
  );
}
