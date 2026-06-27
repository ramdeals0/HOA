'use client';

import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

export function SignOutButton({
  className,
  variant = 'outline',
}: {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
}) {
  const queryClient = useQueryClient();

  async function handleSignOut() {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch {
      // Still redirect even if logout request fails
    }
    queryClient.clear();
    window.location.assign('/login');
  }

  return (
    <Button type="button" variant={variant} className={className} onClick={handleSignOut}>
      Sign out
    </Button>
  );
}
