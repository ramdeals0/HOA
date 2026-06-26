import { cn } from '@/lib/utils';

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        {
          'bg-blue-100 text-blue-800': variant === 'default',
          'bg-green-100 text-green-800': variant === 'success',
          'bg-yellow-100 text-yellow-800': variant === 'warning',
          'bg-red-100 text-red-800': variant === 'destructive',
          'border border-gray-300 text-gray-700': variant === 'outline',
        },
        className,
      )}
    >
      {children}
    </span>
  );
}

export function UpsellBanner({ feature, plan }: { feature: string; plan?: string }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <strong>{feature}</strong> is not available on your {plan ?? 'current'} plan.{' '}
      <a href="#" className="font-medium underline">
        Upgrade to PRO
      </a>{' '}
      to unlock this feature.
    </div>
  );
}
