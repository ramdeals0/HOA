'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PortalNav } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ClassifiedForm,
  classifiedFormToPayload,
  classifiedToFormValues,
} from '@/components/classifieds/classified-form';
import { tenantApi } from '@/lib/api';
import { CONTENT_RETENTION_NOTICE } from '@/lib/content-retention';
import type { ClassifiedListing } from '@/components/classifieds/classifieds-list';

export default function EditClassifiedPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const slug = params.tenantSlug as string;
  const id = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-classifieds', slug],
    queryFn: () => tenantApi<{ listings: ClassifiedListing[] }>(slug, '/classifieds?mine=true'),
  });

  const listing = data?.listings.find((item) => item.id === id);

  async function handleSubmit(form: Parameters<typeof classifiedFormToPayload>[0]) {
    await tenantApi(slug, `/classifieds/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(classifiedFormToPayload(form)),
    });
    await qc.invalidateQueries({ queryKey: ['my-classifieds', slug] });
    await qc.invalidateQueries({ queryKey: ['classifieds', slug] });
    router.push(`/t/${slug}/portal/classifieds`);
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-white p-4">
        <PortalNav slug={slug} />
      </aside>
      <main className="flex-1 p-8">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Edit Classified</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-gray-500">{CONTENT_RETENTION_NOTICE}</p>
            {isLoading && <p className="text-sm text-gray-500">Loading listing...</p>}
            {error && (
              <p className="text-sm text-red-600">
                {error instanceof Error ? error.message : 'Unable to load listing.'}
              </p>
            )}
            {!isLoading && !listing && (
              <p className="text-sm text-red-600">Listing not found or it has expired.</p>
            )}
            {listing && (
              <ClassifiedForm
                initialValues={classifiedToFormValues(listing)}
                submitLabel="Save changes"
                onSubmit={handleSubmit}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
