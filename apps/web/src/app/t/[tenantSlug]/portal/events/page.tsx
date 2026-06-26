'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PortalNav } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api, tenantApi } from '@/lib/api';
import {
  buildCalendarDays,
  formatMeetingDateTime,
  formatMonthYear,
  getMonthRange,
  isSameDay,
  isToday,
  meetingTypeClass,
  meetingTypeLabel,
  meetingsOnDay,
  type CommunityMeeting,
} from '@/lib/meetings';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function EventsCalendarPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ currentTenant: { role: string } | null }>('/api/auth/me'),
  });

  const monthRange = useMemo(() => getMonthRange(viewDate), [viewDate]);
  const calendarDays = useMemo(() => buildCalendarDays(viewDate), [viewDate]);

  const { data } = useQuery({
    queryKey: ['meetings', slug, monthRange.from, monthRange.to],
    queryFn: () =>
      tenantApi<{ meetings: CommunityMeeting[] }>(
        slug,
        `/meetings?from=${monthRange.from}&to=${monthRange.to}`,
      ),
  });

  const meetings = data?.meetings ?? [];
  const selectedMeetings = meetingsOnDay(meetings, selectedDate);

  function goToPreviousMonth() {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  function goToToday() {
    const today = new Date();
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-white p-4">
        <PortalNav slug={slug} role={me?.currentTenant?.role} />
      </aside>
      <main className="flex-1 p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Events Calendar</h1>
            <p className="mt-1 text-sm text-gray-500">Community meetings and events</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              Next
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>{formatMonthYear(viewDate)}</CardTitle>
              <CardDescription>Click a day to view scheduled events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map(({ date, inMonth }) => {
                  const dayMeetings = meetingsOnDay(meetings, date);
                  const selected = isSameDay(date, selectedDate);
                  const today = isToday(date);

                  return (
                    <button
                      key={date.toISOString()}
                      type="button"
                      onClick={() => setSelectedDate(date)}
                      className={[
                        'min-h-24 rounded-lg border p-2 text-left transition-colors',
                        inMonth ? 'bg-white' : 'bg-gray-50 text-gray-400',
                        selected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-blue-200',
                        today && !selected ? 'border-blue-300 bg-blue-50/40' : '',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'inline-flex h-7 w-7 items-center justify-center rounded-full text-sm',
                          today ? 'bg-blue-600 font-semibold text-white' : '',
                        ].join(' ')}
                      >
                        {date.getDate()}
                      </span>
                      <div className="mt-2 space-y-1">
                        {dayMeetings.slice(0, 2).map((meeting) => (
                          <div
                            key={meeting.id}
                            className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${meetingTypeClass(meeting.meetingType)}`}
                          >
                            {meeting.title}
                          </div>
                        ))}
                        {dayMeetings.length > 2 && (
                          <p className="text-[10px] text-gray-500">+{dayMeetings.length - 2} more</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </CardTitle>
              <CardDescription>
                {selectedMeetings.length === 0
                  ? 'No events scheduled'
                  : `${selectedMeetings.length} event${selectedMeetings.length === 1 ? '' : 's'}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedMeetings.length === 0 ? (
                <p className="text-sm text-gray-500">Select another day or browse upcoming months.</p>
              ) : (
                <ul className="space-y-4">
                  {selectedMeetings.map((meeting) => (
                    <li key={meeting.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{meeting.title}</p>
                        <Badge variant="outline" className={meetingTypeClass(meeting.meetingType)}>
                          {meetingTypeLabel(meeting.meetingType)}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">{formatMeetingDateTime(meeting.scheduledAt)}</p>
                      {meeting.location && (
                        <p className="mt-1 text-sm text-gray-500">{meeting.location}</p>
                      )}
                      {meeting.description && (
                        <p className="mt-2 text-sm text-gray-600">{meeting.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>All Events This Month</CardTitle>
          </CardHeader>
          <CardContent>
            {meetings.length === 0 ? (
              <p className="text-sm text-gray-500">No events scheduled for {formatMonthYear(viewDate)}.</p>
            ) : (
              <ul className="divide-y">
                {meetings.map((meeting) => (
                  <li key={meeting.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium">{meeting.title}</p>
                      <p className="text-sm text-gray-600">{formatMeetingDateTime(meeting.scheduledAt)}</p>
                      {meeting.location && <p className="text-xs text-gray-500">{meeting.location}</p>}
                    </div>
                    <Badge variant="outline" className={meetingTypeClass(meeting.meetingType)}>
                      {meetingTypeLabel(meeting.meetingType)}
                    </Badge>
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
