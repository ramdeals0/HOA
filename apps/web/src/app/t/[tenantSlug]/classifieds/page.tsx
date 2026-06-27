'use client';

import { useParams } from 'next/navigation';
import { TenantPublicShell } from '@/components/layout/tenant-public-shell';
import { ClassifiedsList } from '@/components/classifieds/classifieds-list';

export default function ClassifiedsPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;

  return (
    <TenantPublicShell
      slug={slug}
      title="Community Classifieds"
      description="Buy, sell, and trade with your neighbors."
    >
      <ClassifiedsList slug={slug} />
    </TenantPublicShell>
  );
}
