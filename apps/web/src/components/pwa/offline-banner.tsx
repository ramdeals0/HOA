'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 top-0 z-[100] bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950 shadow-md">
      You are offline. Some data may be stale.
    </div>
  );
}
