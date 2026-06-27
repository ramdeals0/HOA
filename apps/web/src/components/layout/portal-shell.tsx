'use client';

import { useState, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import { PortalNav } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { useOnlineStatus } from '@/hooks/use-online-status';

export function PortalShell({
  slug,
  role,
  children,
}: {
  slug: string;
  role?: string;
  children: ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const isOnline = useOnlineStatus();

  return (
    <div className={`flex min-h-screen flex-col md:flex-row ${isOnline ? '' : 'pt-10'}`}>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b bg-white px-4 py-3 md:hidden">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Member Portal</p>
          <p className="text-sm font-semibold text-gray-900">Neighborhood+1</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-11 w-11 px-0"
          aria-label={navOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setNavOpen((open) => !open)}
        >
          {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {navOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          aria-label="Close navigation menu"
          onClick={() => setNavOpen(false)}
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r bg-white p-4 transition-transform md:static md:z-auto md:w-56 md:max-w-none md:translate-x-0',
          navOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <PortalNav slug={slug} role={role} onNavigate={() => setNavOpen(false)} />
      </aside>

      <main className="flex-1 p-4 sm:p-6 md:p-8">{children}</main>
    </div>
  );
}
