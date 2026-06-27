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
      description="Buy, sell, and trade with your neighbors. Listings are automatically removed after 30 days."
    >
      <ClassifiedsList slug={slug} />
    </TenantPublicShell>
  );
}
