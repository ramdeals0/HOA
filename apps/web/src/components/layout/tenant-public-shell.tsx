'use client';

import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TenantHeader } from '@/components/layout/header';
import { SiteFooter } from '@/components/layout/site-footer';
import { api } from '@/lib/api';

const maxWidthClasses = {
  lg: 'max-w-lg',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
} as const;

export function TenantPublicShell({
  slug,
  tenantName,
  title,
  description,
  maxWidth = '4xl',
  children,
}: {
  slug: string;
  tenantName?: string;
  title?: string;
  description?: string;
  maxWidth?: keyof typeof maxWidthClasses;
  children: ReactNode;
}) {
  const { data: tenant } = useQuery({
    queryKey: ['tenant', slug],
    queryFn: () => api<{ name: string; slug: string; primaryColor?: string }>(`/api/tenants/${slug}`),
    enabled: !tenantName,
  });

  const name = tenantName ?? tenant?.name ?? 'Community';

  return (
    <div className="flex min-h-screen flex-col">
      <TenantHeader slug={slug} name={name} />
      <main className="flex-1 bg-gray-50">
        <div className={`mx-auto ${maxWidthClasses[maxWidth]} px-4 py-8 sm:py-12`}>
          {title && <h1 className="mb-2 text-2xl font-bold sm:text-3xl">{title}</h1>}
          {description && <p className="mb-6 text-sm text-gray-600 sm:text-base">{description}</p>}
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
