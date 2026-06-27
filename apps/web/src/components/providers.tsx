'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { OfflineActionProvider } from '@/components/pwa/offline-action-provider';
import { OfflineBanner } from '@/components/pwa/offline-banner';
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <OfflineActionProvider>
        <ServiceWorkerRegister />
        <OfflineBanner />
        {children}
      </OfflineActionProvider>
    </QueryClientProvider>
  );
}
