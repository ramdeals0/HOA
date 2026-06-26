'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { PortalNav } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api, tenantApi, formatCurrency, formatDate } from '@/lib/api';

function formatMeetingDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function PortalDashboard() {
  const params = useParams();
  const slug = params.tenantSlug as string;
  const year = new Date().getFullYear();

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ currentTenant: { role: string } | null }>('/api/auth/me'),
  });

  const { data: invoices } = useQuery({
    queryKey: ['my-invoices', slug],
    queryFn: () =>
      tenantApi<{
        invoices: Array<{ id: string; amountCents: number; dueDate: string; status: string; description: string }>;
      }>(slug, '/invoices/my'),
  });

  const { data: news } = useQuery({
    queryKey: ['news', slug],
    queryFn: () =>
      tenantApi<{ posts: Array<{ id: string; title: string; createdAt: string; body: string }> }>(slug, '/news'),
  });

  const { data: meetings } = useQuery({
    queryKey: ['meetings', slug, year],
    queryFn: () =>
      tenantApi<{
        meetings: Array<{
          id: string;
          title: string;
          scheduledAt: string;
          location: string | null;
          description: string | null;
          meetingType: string;
        }>;
        year: number;
      }>(slug, `/meetings?year=${year}`),
  });

  const unpaid = invoices?.invoices.filter((i) => i.status === 'OPEN' || i.status === 'OVERDUE') ?? [];
  const nextDue = unpaid.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
  const upcomingMeetings = (meetings?.meetings ?? []).filter(
    (m) => new Date(m.scheduledAt) >= new Date(new Date().setHours(0, 0, 0, 0)),
  );
  const role = me?.currentTenant?.role;

  async function payNow(invoiceId: string) {
    const session = await tenantApi<{ url: string }>(slug, '/payments/checkout-session', {
      method: 'POST',
      body: JSON.stringify({ invoiceId }),
    });
    if (session.url) window.location.href = session.url;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-white p-4">
        <PortalNav slug={slug} role={role} />
      </aside>
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Welcome back to your community portal</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Due date */}
          <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader>
              <CardTitle>Due Date</CardTitle>
              <CardDescription>Your next HOA dues payment</CardDescription>
            </CardHeader>
            <CardContent>
              {nextDue ? (
                <>
                  <p className="text-3xl font-bold text-blue-900">{formatCurrency(nextDue.amountCents)}</p>
                  <p className="mt-2 text-sm font-medium text-blue-800">Due {formatDate(nextDue.dueDate)}</p>
                  <p className="mt-1 text-xs text-gray-500">{nextDue.description}</p>
                  {nextDue.status === 'OVERDUE' && (
                    <Badge variant="destructive" className="mt-3">
                      OVERDUE
                    </Badge>
                  )}
                  <Button className="mt-4 w-full" onClick={() => payNow(nextDue.id)}>
                    Pay Now
                  </Button>
                </>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-lg font-semibold text-green-700">All paid up</p>
                  <p className="mt-1 text-sm text-gray-500">No outstanding dues at this time</p>
                  <Link href={`/t/${slug}/portal/payments`}>
                    <Button variant="outline" className="mt-4 w-full">
                      View payment history
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Yearly meeting schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Yearly Meeting Schedule</CardTitle>
              <CardDescription>{year} community meetings</CardDescription>
            </CardHeader>
            <CardContent>
              {(meetings?.meetings ?? []).length === 0 ? (
                <p className="text-sm text-gray-500">No meetings scheduled for {year} yet.</p>
              ) : (
                <ul className="space-y-4">
                  {meetings?.meetings.map((meeting) => {
                    const isPast = new Date(meeting.scheduledAt) < new Date();
                    return (
                      <li
                        key={meeting.id}
                        className={`rounded-lg border p-3 ${isPast ? 'bg-gray-50 opacity-75' : 'border-amber-100 bg-amber-50/40'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium leading-snug">{meeting.title}</p>
                          <Badge variant="outline" className="shrink-0 text-[10px]">
                            {meeting.meetingType}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{formatMeetingDate(meeting.scheduledAt)}</p>
                        {meeting.location && (
                          <p className="mt-1 text-xs text-gray-500">{meeting.location}</p>
                        )}
                        {isPast ? (
                          <span className="mt-2 inline-block text-xs text-gray-400">Completed</span>
                        ) : upcomingMeetings[0]?.id === meeting.id ? (
                          <span className="mt-2 inline-block text-xs font-medium text-amber-700">Next up</span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Latest news */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Latest News</CardTitle>
                  <CardDescription>Recent community updates</CardDescription>
                </div>
                <Link href={`/t/${slug}/news`} className="text-sm text-blue-600 hover:underline">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {(news?.posts ?? []).length === 0 ? (
                <p className="text-sm text-gray-500">No news posts yet.</p>
              ) : (
                <ul className="space-y-4">
                  {(news?.posts ?? []).slice(0, 3).map((post) => (
                    <li key={post.id} className="border-b pb-4 last:border-0 last:pb-0">
                      <Link
                        href={`/t/${slug}/news/${post.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600 hover:underline"
                      >
                        {post.title}
                      </Link>
                      <p className="mt-1 text-xs text-gray-400">{formatDate(post.createdAt)}</p>
                      <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                        {post.body.replace(/<[^>]+>/g, ' ').trim()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
