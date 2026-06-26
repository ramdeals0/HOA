'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PortalNav } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { api, tenantApi } from '@/lib/api';
import { formatMeetingDateTime, meetingTypeClass, meetingTypeLabel, type CommunityMeeting } from '@/lib/meetings';

const EVENT_TYPES = ['GENERAL', 'ANNUAL', 'BOARD', 'SPECIAL', 'SOCIAL'] as const;

export default function AdminMeetingsPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;
  const qc = useQueryClient();
  const year = new Date().getFullYear();

  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [meetingType, setMeetingType] = useState<(typeof EVENT_TYPES)[number]>('GENERAL');

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ currentTenant: { role: string } | null }>('/api/auth/me'),
  });

  const { data } = useQuery({
    queryKey: ['admin-meetings', slug, year],
    queryFn: () => tenantApi<{ meetings: CommunityMeeting[] }>(slug, `/meetings?year=${year}`),
  });

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    await tenantApi(slug, '/meetings', {
      method: 'POST',
      body: JSON.stringify({
        title,
        scheduledAt: new Date(scheduledAt).toISOString(),
        location: location || undefined,
        description: description || undefined,
        meetingType,
      }),
    });
    setTitle('');
    setScheduledAt('');
    setLocation('');
    setDescription('');
    setMeetingType('GENERAL');
    qc.invalidateQueries({ queryKey: ['admin-meetings', slug] });
    qc.invalidateQueries({ queryKey: ['meetings', slug] });
  }

  async function deleteEvent(id: string) {
    await tenantApi(slug, `/meetings/${id}`, { method: 'DELETE' });
    qc.invalidateQueries({ queryKey: ['admin-meetings', slug] });
    qc.invalidateQueries({ queryKey: ['meetings', slug] });
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-white p-4">
        <PortalNav slug={slug} role={me?.currentTenant?.role} />
      </aside>
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold">Events Calendar</h1>
        <p className="mt-1 text-sm text-gray-500">Create and manage community events for the calendar</p>

        <Card className="mt-6">
          <CardHeader><CardTitle>Add Event</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={createEvent} className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
              />
              <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
              <select
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value as (typeof EVENT_TYPES)[number])}
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {meetingTypeLabel(type)}
                  </option>
                ))}
              </select>
              <Textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="md:col-span-2"
              />
              <div className="md:col-span-2">
                <Button type="submit">Create Event</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader><CardTitle>{year} Events</CardTitle></CardHeader>
          <CardContent>
            {(data?.meetings ?? []).length === 0 ? (
              <p className="text-sm text-gray-500">No events scheduled yet.</p>
            ) : (
              <ul className="divide-y">
                {(data?.meetings ?? []).map((meeting) => (
                  <li key={meeting.id} className="flex flex-wrap items-start justify-between gap-4 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{meeting.title}</p>
                        <Badge variant="outline" className={meetingTypeClass(meeting.meetingType)}>
                          {meetingTypeLabel(meeting.meetingType)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{formatMeetingDateTime(meeting.scheduledAt)}</p>
                      {meeting.location && <p className="text-sm text-gray-500">{meeting.location}</p>}
                      {meeting.description && <p className="mt-1 text-sm text-gray-600">{meeting.description}</p>}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => deleteEvent(meeting.id)}>
                      Delete
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
