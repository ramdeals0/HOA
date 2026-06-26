import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api, formatDate } from '@/lib/api';
import { TenantHeader } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function NewsListPage({ params }: { params: { tenantSlug: string } }) {
  const tenant = await api<{ name: string; slug: string }>(`/api/tenants/${params.tenantSlug}`).catch(() => null);
  if (!tenant) notFound();

  const { posts } = await api<{ posts: Array<{ id: string; title: string; body: string; createdAt: string }> }>(
    `/api/t/${params.tenantSlug}/news`,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <TenantHeader slug={tenant.slug} name={tenant.name} />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold">Community News</h1>
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <CardTitle>
                  <Link href={`/t/${params.tenantSlug}/news/${post.id}`} className="hover:underline">
                    {post.title}
                  </Link>
                </CardTitle>
                <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
              </CardHeader>
              <CardContent>
                <div className="line-clamp-3 text-gray-600" dangerouslySetInnerHTML={{ __html: post.body }} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
