import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { TenantHeader } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DocumentsPage({ params }: { params: { tenantSlug: string } }) {
  const tenant = await api<{ name: string; slug: string }>(`/api/tenants/${params.tenantSlug}`).catch(() => null);
  if (!tenant) notFound();

  const { documents } = await api<{ documents: Array<{ id: string; title: string; description: string | null; fileUrl: string; visibility: string }> }>(
    `/api/t/${params.tenantSlug}/documents`,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <TenantHeader slug={tenant.slug} name={tenant.name} />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold">Documents</h1>
        <div className="space-y-4">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <CardTitle className="text-lg">{doc.title}</CardTitle>
                {doc.description && <p className="text-sm text-gray-500">{doc.description}</p>}
              </CardHeader>
              <CardContent>
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Download PDF
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
