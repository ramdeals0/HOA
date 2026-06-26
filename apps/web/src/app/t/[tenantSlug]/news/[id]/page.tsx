import { notFound } from 'next/navigation';
import Link from 'next/link';
import { api, formatDate } from '@/lib/api';
import { TenantHeader } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function NewsDetailPage({
  params,
}: {
  params: { tenantSlug: string; id: string };
}) {
  const tenant = await api<{ name: string; slug: string }>(`/api/tenants/${params.tenantSlug}`).catch(() => null);
  if (!tenant) notFound();

  const { post } = await api<{ post: { id: string; title: string; body: string; createdAt: string } }>(
    `/api/t/${params.tenantSlug}/news/${params.id}`,
  ).catch(() => notFound());

  return (
    <div className="min-h-screen bg-gray-50">
      <TenantHeader slug={tenant.slug} name={tenant.name} />
      <article className="mx-auto max-w-3xl px-4 py-12">
        <Link href={`/t/${params.tenantSlug}/news`} className="text-sm text-blue-600 hover:underline">
          ← Back to news
        </Link>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-2xl">{post.title}</CardTitle>
            <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: post.body }} />
          </CardContent>
        </Card>
      </article>
    </div>
  );
}
