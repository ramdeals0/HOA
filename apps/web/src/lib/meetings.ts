export type CommunityMeeting = {
  id: string;
  title: string;
  scheduledAt: string;
  location: string | null;
  description: string | null;
  meetingType: string;
};

export function formatMeetingDateTime(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatMonthYear(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { from: formatInputDate(start), to: formatInputDate(end) };
}

export function buildCalendarDays(viewDate: Date) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return { date, inMonth: date.getMonth() === month };
  });
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(date: Date) {
  return isSameDay(date, new Date());
}

export function meetingsOnDay(meetings: CommunityMeeting[], day: Date) {
  return meetings.filter((meeting) => isSameDay(new Date(meeting.scheduledAt), day));
}

export function meetingTypeLabel(type: string) {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

export function meetingTypeClass(type: string) {
  switch (type) {
    case 'ANNUAL':
      return 'bg-blue-100 text-blue-800';
    case 'BOARD':
      return 'bg-purple-100 text-purple-800';
    case 'SPECIAL':
      return 'bg-amber-100 text-amber-800';
    case 'SOCIAL':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
