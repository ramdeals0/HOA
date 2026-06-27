'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { Button } from '@/components/ui/button';

type OfflineActionContextValue = {
  isOnline: boolean;
  guardAction: (action: () => void | Promise<void>) => void;
};

const OfflineActionContext = createContext<OfflineActionContextValue | null>(null);

export function OfflineActionProvider({ children }: { children: ReactNode }) {
  const isOnline = useOnlineStatus();
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  const guardAction = useCallback(
    (action: () => void | Promise<void>) => {
      if (!isOnline) {
        setShowOfflineModal(true);
        return;
      }
      void action();
    },
    [isOnline],
  );

  const value = useMemo(() => ({ isOnline, guardAction }), [guardAction, isOnline]);

  return (
    <OfflineActionContext.Provider value={value}>
      {children}
      {showOfflineModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">You are offline</h2>
            <p className="mt-3 text-sm text-gray-600">
              You are offline. Please reconnect to complete this action.
            </p>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowOfflineModal(false)}>OK</Button>
            </div>
          </div>
        </div>
      )}
    </OfflineActionContext.Provider>
  );
}

export function useOfflineAction() {
  const context = useContext(OfflineActionContext);
  if (!context) {
    throw new Error('useOfflineAction must be used within OfflineActionProvider');
  }
  return context;
}
