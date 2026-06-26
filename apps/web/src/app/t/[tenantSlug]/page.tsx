import { notFound } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { TenantProvider, TenantInfo } from '@/contexts/tenant-context';
import { TenantHeader } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/api';

async function getTenant(slug: string): Promise<TenantInfo | null> {
  try {
    return await api<TenantInfo>(`/api/tenants/${slug}`);
  } catch {
    return null;
  }
}

export default async function TenantHomePage({ params }: { params: { tenantSlug: string } }) {
  const tenant = await getTenant(params.tenantSlug);
  if (!tenant) notFound();

  let posts: Array<{ id: string; title: string; body: string; createdAt: string }> = [];
  try {
    const data = await api<{ posts: typeof posts }>(`/api/t/${params.tenantSlug}/news`);
    posts = data.posts.slice(0, 3);
  } catch {
    // public fetch may fail without auth for members-only posts - ok
  }

  return (
    <TenantProvider tenant={tenant}>
      <div className="min-h-screen">
        <TenantHeader slug={tenant.slug} name={tenant.name} />
        <main>
          <section className="bg-gradient-to-b from-blue-50 to-white py-16">
            <div className="mx-auto max-w-4xl px-4 text-center">
              <h1 className="text-3xl font-bold sm:text-4xl" style={{ color: tenant.primaryColor ?? '#2563eb' }}>
                {tenant.name}
              </h1>
              <p className="mt-4 text-gray-600">
                Welcome to our community portal. Stay connected with news, documents, and neighbor classifieds.
              </p>
              <div className="mt-6 flex justify-center gap-4">
                <Link href={`/t/${tenant.slug}/membership`}>
                  <Button>Request Membership</Button>
                </Link>
                <Link href={`/t/${tenant.slug}/news`}>
                  <Button variant="outline">View News</Button>
                </Link>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-4xl px-4 py-12">
            <h2 className="mb-6 text-2xl font-bold">Latest News</h2>
            <div className="grid gap-4">
              {posts.length === 0 ? (
                <p className="text-gray-500">No public news posts yet.</p>
              ) : (
                posts.map((post) => (
                  <Card key={post.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        <Link href={`/t/${tenant.slug}/news/${post.id}`} className="hover:underline">
                          {post.title}
                        </Link>
                      </CardTitle>
                      <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="line-clamp-2 text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: post.body }} />
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </section>

          <section className="border-t bg-white py-12">
            <div className="mx-auto max-w-4xl px-4 text-center">
              <h3 className="font-semibold">Contact</h3>
              <p className="mt-2 text-gray-600">{tenant.primaryContactEmail}</p>
              {tenant.address && (
                <p className="text-gray-500">
                  {tenant.address}
                  {tenant.state ? `, ${tenant.state}` : ''}
                </p>
              )}
            </div>
          </section>
        </main>
      </div>
    </TenantProvider>
  );
}
