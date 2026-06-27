'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { TenantPublicShell } from '@/components/layout/tenant-public-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OfflineNotice } from '@/components/pwa/offline-notice';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { api, formatDate } from '@/lib/api';

export default function NewsDetailPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;
  const id = params.id as string;
  const isOnline = useOnlineStatus();

  const { data, isLoading, error } = useQuery({
    queryKey: ['news', slug, id],
    queryFn: () =>
      api<{ post: { id: string; title: string; body: string; createdAt: string } }>(
        `/api/t/${slug}/news/${id}`,
        { tenantSlug: slug },
      ),
  });

  const post = data?.post;

  return (
    <TenantPublicShell slug={slug} maxWidth="4xl" showHeaderNav={false}>
      <Link href={`/t/${slug}/news`} className="text-sm text-blue-600 hover:underline">
        ← Back to news
      </Link>
      <OfflineNotice visible={!isOnline && Boolean(post)} />

      {isLoading && <p className="mt-4 text-gray-500">Loading article...</p>}
      {error && !post && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {isOnline
            ? 'Unable to load this article.'
            : 'You are offline and this article is not available in cache yet.'}
        </p>
      )}

      {post && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">{post.title}</CardTitle>
            <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: post.body }} />
          </CardContent>
        </Card>
      )}
    </TenantPublicShell>
  );
}
