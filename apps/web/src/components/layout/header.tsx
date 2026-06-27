import Link from 'next/link';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { PortalSessionInfo } from '@/components/auth/portal-session-info';

export function SiteHeader() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-blue-600">
          HOA Portal SaaS
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/privacy" className="text-gray-600 hover:text-gray-900">
            Privacy
          </Link>
          <Link href="/signup" className="text-gray-600 hover:text-gray-900">
            Start your HOA
          </Link>
          <Link href="/login" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function TenantHeader({
  slug,
  name,
  showNav = true,
}: {
  slug: string;
  name: string;
  showNav?: boolean;
}) {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href={`/t/${slug}`} className="text-xl font-bold" style={{ color: 'var(--primary, #2563eb)' }}>
          {name}
        </Link>
        {showNav && (
          <nav className="flex flex-wrap items-center gap-2 text-sm sm:gap-4">
            <Link href={`/t/${slug}/news`} className="rounded-md px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900">
              News
            </Link>
            <Link href={`/t/${slug}/classifieds`} className="rounded-md px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900">
              Classifieds
            </Link>
            <Link href={`/t/${slug}/documents`} className="rounded-md px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900">
              Documents
            </Link>
            <Link href={`/t/${slug}/membership`} className="rounded-md px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900">
              Join
            </Link>
            <Link href="/login" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Login
            </Link>
          </nav>
        )}
      </div>
    </header>
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
  const linkClassName = 'rounded px-3 py-3 hover:bg-gray-100 md:py-2';

  return (
    <nav className="flex min-h-[calc(100vh-2rem)] flex-col gap-1 text-sm">
      <PortalSessionInfo />
      <div className="flex flex-1 flex-col gap-1">
      <Link href={`/t/${slug}/portal`} className={linkClassName} onClick={onNavigate}>
        Dashboard
      </Link>
      <Link href={`/t/${slug}/portal/account`} className={linkClassName} onClick={onNavigate}>
        My Account
      </Link>
      <Link href={`/t/${slug}/portal/payments`} className={linkClassName} onClick={onNavigate}>
        Statements & Payments
      </Link>
      <Link href={`/t/${slug}/portal/maintenance`} className={linkClassName} onClick={onNavigate}>
        Maintenance
      </Link>
      <Link href={`/t/${slug}/portal/events`} className={linkClassName} onClick={onNavigate}>
        Events Calendar
      </Link>
      <Link href={`/t/${slug}/portal/directory`} className={linkClassName} onClick={onNavigate}>
        Resident Directory
      </Link>
      <Link href={`/t/${slug}/portal/settings`} className={linkClassName} onClick={onNavigate}>
        Privacy Settings
      </Link>
      <Link href={`/t/${slug}/news`} className={linkClassName} onClick={onNavigate}>
        News
      </Link>
      <Link href={`/t/${slug}/portal/documents`} className={linkClassName} onClick={onNavigate}>
        Documents
      </Link>
      <Link href={`/t/${slug}/portal/voting`} className={linkClassName} onClick={onNavigate}>
        Community Voting
      </Link>
      <Link href={`/t/${slug}/portal/classifieds`} className={linkClassName} onClick={onNavigate}>
        Classifieds
      </Link>
      <Link href={`/t/${slug}/portal/classifieds/new`} className={linkClassName} onClick={onNavigate}>
        Post Classified
      </Link>
      {isBoard && (
        <>
          <hr className="my-2" />
          <span className="px-3 text-xs font-semibold uppercase text-gray-400">Board</span>
          <Link href={`/t/${slug}/admin/applications`} className={linkClassName} onClick={onNavigate}>
            Applications
          </Link>
          <Link href={`/t/${slug}/admin/news`} className={linkClassName} onClick={onNavigate}>
            News
          </Link>
          <Link href={`/t/${slug}/admin/blasts`} className={linkClassName} onClick={onNavigate}>
            Blast Center
          </Link>
          <Link href={`/t/${slug}/admin/classifieds`} className={linkClassName} onClick={onNavigate}>
            Classified Approvals
          </Link>
          <Link href={`/t/${slug}/admin/invoices`} className={linkClassName} onClick={onNavigate}>
            Dues & Invoices
          </Link>
          <Link href={`/t/${slug}/admin/reports`} className={linkClassName} onClick={onNavigate}>
            Reports
          </Link>
          <Link href={`/t/${slug}/admin/voting`} className={linkClassName} onClick={onNavigate}>
            Resolutions & Polls
          </Link>
          <Link href={`/t/${slug}/admin/meetings`} className={linkClassName} onClick={onNavigate}>
            Events Calendar
          </Link>
          <Link href={`/t/${slug}/admin/documents`} className={linkClassName} onClick={onNavigate}>
            Documents
          </Link>
        </>
      )}
      {isStaff && (
        <Link href={`/t/${slug}/admin/maintenance`} className={linkClassName} onClick={onNavigate}>
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
