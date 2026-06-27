'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';

export function OfflineNotice({ visible }: { visible?: boolean }) {
  const isOnline = useOnlineStatus();

  if (isOnline || visible === false) {
    return null;
  }

  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      Offline – showing last available data.
    </div>
  );
}
