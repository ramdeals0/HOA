'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { TenantHeader } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OfflineNotice } from '@/components/pwa/offline-notice';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { api, formatDate } from '@/lib/api';

export default function NewsListPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;
  const isOnline = useOnlineStatus();

  const { data: tenant } = useQuery({
    queryKey: ['tenant', slug],
    queryFn: () => api<{ name: string; slug: string }>(`/api/tenants/${slug}`),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['news', slug],
    queryFn: () =>
      api<{ posts: Array<{ id: string; title: string; body: string; createdAt: string }> }>(
        `/api/t/${slug}/news`,
        { tenantSlug: slug },
      ),
  });

  const posts = data?.posts ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <TenantHeader slug={slug} name={tenant?.name ?? 'Community'} />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <h1 className="mb-6 text-2xl font-bold sm:text-3xl">Community News</h1>
        <OfflineNotice visible={!isOnline && posts.length > 0} />

        {isLoading && <p className="text-gray-500">Loading news...</p>}
        {error && posts.length === 0 && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {isOnline
              ? 'Unable to load news right now.'
              : 'You are offline and no cached news is available yet. Visit this page once while online to enable offline reading.'}
          </p>
        )}

        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">
                  <Link href={`/t/${slug}/news/${post.id}`} className="hover:underline">
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
