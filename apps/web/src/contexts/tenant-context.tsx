'use client';

import { createContext, useContext, ReactNode } from 'react';

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  primaryColor?: string;
  plan?: string;
  primaryContactEmail?: string;
  address?: string | null;
  state?: string | null;
}

interface TenantContextValue {
  tenant: TenantInfo;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({
  tenant,
  children,
}: {
  tenant: TenantInfo;
  children: ReactNode;
}) {
  return (
    <TenantContext.Provider value={{ tenant }}>
      <div style={{ '--primary': tenant.primaryColor ?? '#2563eb' } as React.CSSProperties}>
        {children}
      </div>
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within TenantProvider');
  return ctx;
}
