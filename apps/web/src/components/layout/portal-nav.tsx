'use client';

import Link from 'next/link';
import {
  Building2,
  CreditCard,
  FileText,
  Home,
  Phone,
  User,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  PORTAL_OPTIONAL_NAV_KEYS,
  PORTAL_OPTIONAL_NAV_LABELS,
  type PortalOptionalNavConfig,
  type PortalOptionalNavKey,
} from '@hoa/shared';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { PortalSessionInfo } from '@/components/auth/portal-session-info';
import { isPortalFeatureEnabled } from '@/lib/portal-nav';
import { tenantApi } from '@/lib/api';

type CoreNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const CORE_NAV_ITEMS: CoreNavItem[] = [
  { label: 'Home', href: 'portal', icon: Home },
  { label: 'My Account', href: 'portal/account', icon: User },
  { label: 'HOA Payment', href: 'portal/payments', icon: CreditCard },
  { label: 'HOA Maintenance', href: 'portal/maintenance', icon: Wrench },
  { label: 'HOA Management', href: 'portal/management', icon: Building2 },
  { label: 'HOA Covenants', href: 'portal/documents', icon: FileText },
  { label: 'Contact Us', href: 'portal/contact', icon: Phone },
];

const OPTIONAL_NAV_ROUTES: Record<PortalOptionalNavKey, { label: string; href: string }> = {
  events: { label: PORTAL_OPTIONAL_NAV_LABELS.events, href: 'portal/events' },
  directory: { label: PORTAL_OPTIONAL_NAV_LABELS.directory, href: 'portal/directory' },
  privacySettings: { label: PORTAL_OPTIONAL_NAV_LABELS.privacySettings, href: 'portal/settings' },
  news: { label: PORTAL_OPTIONAL_NAV_LABELS.news, href: 'news' },
  voting: { label: PORTAL_OPTIONAL_NAV_LABELS.voting, href: 'portal/voting' },
  classifieds: { label: PORTAL_OPTIONAL_NAV_LABELS.classifieds, href: 'portal/classifieds' },
  postClassified: { label: PORTAL_OPTIONAL_NAV_LABELS.postClassified, href: 'portal/classifieds/new' },
};

function NavLink({
  slug,
  href,
  label,
  icon: Icon,
  onNavigate,
}: {
  slug: string;
  href: string;
  label: string;
  icon: LucideIcon;
  onNavigate?: () => void;
}) {
  const path = `/t/${slug}/${href}`;

  return (
    <Link
      href={path}
      className="flex items-center gap-3 rounded-md px-3 py-3 text-sm hover:bg-gray-100 md:py-2"
      onClick={onNavigate}
    >
      <Icon className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}

export function PortalNav({
  slug,
  role,
  onNavigate,
}: {
  slug: string;
  role?: string;
  onNavigate?: () => void;
}) {
  const isBoard = role && ['SUPER_ADMIN', 'BOARD'].includes(role);
  const isStaff = role && ['SUPER_ADMIN', 'BOARD', 'MANAGER'].includes(role);

  const { data } = useQuery({
    queryKey: ['portal-nav', slug],
    queryFn: () => tenantApi<{ portalNav: PortalOptionalNavConfig }>(slug, '/portal-nav'),
  });

  const portalNav = data?.portalNav;
  const enabledOptionalKeys = PORTAL_OPTIONAL_NAV_KEYS.filter((key) =>
    isPortalFeatureEnabled(key, role, portalNav),
  );

  const boardLinkClassName = 'rounded px-3 py-3 text-sm hover:bg-gray-100 md:py-2';

  return (
    <nav className="flex min-h-[calc(100vh-2rem)] flex-col gap-1 text-sm">
      <div className="mb-2 px-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <Building2 className="h-4 w-4" aria-hidden="true" />
          HOA Portal
        </div>
      </div>

      <PortalSessionInfo />

      <div className="mt-2 flex flex-1 flex-col gap-1">
        {CORE_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            slug={slug}
            href={item.href}
            label={item.label}
            icon={item.icon}
            onNavigate={onNavigate}
          />
        ))}

        {enabledOptionalKeys.length > 0 && (
          <>
            <hr className="my-2" />
            <span className="px-3 text-xs font-semibold uppercase text-gray-400">More</span>
            {enabledOptionalKeys.map((key) => {
              const item = OPTIONAL_NAV_ROUTES[key];
              return (
                <Link
                  key={key}
                  href={`/t/${slug}/${item.href}`}
                  className={boardLinkClassName}
                  onClick={onNavigate}
                >
                  {item.label}
                </Link>
              );
            })}
          </>
        )}

        {isBoard && (
          <>
            <hr className="my-2" />
            <span className="px-3 text-xs font-semibold uppercase text-gray-400">Board</span>
            <Link href={`/t/${slug}/admin/applications`} className={boardLinkClassName} onClick={onNavigate}>
              Applications
            </Link>
            <Link href={`/t/${slug}/admin/news`} className={boardLinkClassName} onClick={onNavigate}>
              News
            </Link>
            <Link href={`/t/${slug}/admin/portal-nav`} className={boardLinkClassName} onClick={onNavigate}>
              Portal Navigation
            </Link>
            <Link href={`/t/${slug}/admin/blasts`} className={boardLinkClassName} onClick={onNavigate}>
              Blast Center
            </Link>
            <Link href={`/t/${slug}/admin/classifieds`} className={boardLinkClassName} onClick={onNavigate}>
              Classified Approvals
            </Link>
            <Link href={`/t/${slug}/admin/invoices`} className={boardLinkClassName} onClick={onNavigate}>
              Dues & Invoices
            </Link>
            <Link href={`/t/${slug}/admin/reports`} className={boardLinkClassName} onClick={onNavigate}>
              Reports
            </Link>
            <Link href={`/t/${slug}/admin/voting`} className={boardLinkClassName} onClick={onNavigate}>
              Resolutions & Polls
            </Link>
            <Link href={`/t/${slug}/admin/meetings`} className={boardLinkClassName} onClick={onNavigate}>
              Events Calendar
            </Link>
            <Link href={`/t/${slug}/admin/documents`} className={boardLinkClassName} onClick={onNavigate}>
              Documents
            </Link>
          </>
        )}

        {isStaff && (
          <Link href={`/t/${slug}/admin/maintenance`} className={boardLinkClassName} onClick={onNavigate}>
            Maintenance Board
          </Link>
        )}
      </div>

      <div className="mt-6 border-t pt-4">
        <SignOutButton className="w-full justify-center" variant="ghost" />
      </div>
    </nav>
  );
}

export function usePortalNavConfig(slug: string) {
  return useQuery({
    queryKey: ['portal-nav', slug],
    queryFn: () => tenantApi<{ portalNav: PortalOptionalNavConfig }>(slug, '/portal-nav'),
  });
}
