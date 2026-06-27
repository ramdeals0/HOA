'use client';

import { useParams, useRouter } from 'next/navigation';
import { PortalNav } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClassifiedForm, classifiedFormToPayload } from '@/components/classifieds/classified-form';
import { tenantApi } from '@/lib/api';
import { CONTENT_RETENTION_NOTICE } from '@/lib/content-retention';

export default function NewClassifiedPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.tenantSlug as string;

  async function handleSubmit(form: Parameters<typeof classifiedFormToPayload>[0]) {
    await tenantApi(slug, '/classifieds', {
      method: 'POST',
      body: JSON.stringify(classifiedFormToPayload(form)),
    });
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
            <CardTitle>Post Classified</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-gray-500">
              Your listing will be pending board approval. {CONTENT_RETENTION_NOTICE}
            </p>
            <ClassifiedForm
              initialValues={{
                title: '',
                description: '',
                category: 'General',
                priceCents: '',
                contactEmail: '',
              }}
              submitLabel="Submit for Approval"
              onSubmit={handleSubmit}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
