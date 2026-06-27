'use client';

import { useParams } from 'next/navigation';
import { TenantHeader } from '@/components/layout/header';
import { ClassifiedsList } from '@/components/classifieds/classifieds-list';

export default function ClassifiedsPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;

  return (
    <div className="min-h-screen bg-gray-50">
      <TenantHeader slug={slug} name="Classifieds" />
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-6 text-3xl font-bold">Community Classifieds</h1>
        <ClassifiedsList slug={slug} />
      </div>
    </div>
  );
}
