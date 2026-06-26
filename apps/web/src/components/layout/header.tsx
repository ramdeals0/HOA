import Link from 'next/link';
import { SignOutButton } from '@/components/auth/sign-out-button';

export function SiteHeader() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-blue-600">
          HOA Portal SaaS
        </Link>
        <nav className="flex items-center gap-4 text-sm">
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

export function TenantHeader({ slug, name }: { slug: string; name: string }) {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href={`/t/${slug}`} className="text-xl font-bold" style={{ color: 'var(--primary, #2563eb)' }}>
          {name}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href={`/t/${slug}/news`} className="text-gray-600 hover:text-gray-900">
            News
          </Link>
          <Link href={`/t/${slug}/classifieds`} className="text-gray-600 hover:text-gray-900">
            Classifieds
          </Link>
          <Link href={`/t/${slug}/documents`} className="text-gray-600 hover:text-gray-900">
            Documents
          </Link>
          <Link href={`/t/${slug}/membership`} className="text-gray-600 hover:text-gray-900">
            Join
          </Link>
          <Link href="/login" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function PortalNav({ slug, role }: { slug: string; role?: string }) {
  const isBoard = role && ['SUPER_ADMIN', 'BOARD'].includes(role);
  const isStaff = role && ['SUPER_ADMIN', 'BOARD', 'MANAGER'].includes(role);

  return (
    <nav className="flex min-h-[calc(100vh-2rem)] flex-col gap-1 text-sm">
      <div className="flex flex-1 flex-col gap-1">
      <Link href={`/t/${slug}/portal`} className="rounded px-3 py-2 hover:bg-gray-100">
        Dashboard
      </Link>
      <Link href={`/t/${slug}/portal/account`} className="rounded px-3 py-2 hover:bg-gray-100">
        My Account
      </Link>
      <Link href={`/t/${slug}/portal/payments`} className="rounded px-3 py-2 hover:bg-gray-100">
        Statements & Payments
      </Link>
      <Link href={`/t/${slug}/portal/maintenance`} className="rounded px-3 py-2 hover:bg-gray-100">
        Maintenance
      </Link>
      <Link href={`/t/${slug}/portal/classifieds/new`} className="rounded px-3 py-2 hover:bg-gray-100">
        Post Classified
      </Link>
      {isBoard && (
        <>
          <hr className="my-2" />
          <span className="px-3 text-xs font-semibold uppercase text-gray-400">Board</span>
          <Link href={`/t/${slug}/admin/applications`} className="rounded px-3 py-2 hover:bg-gray-100">
            Applications
          </Link>
          <Link href={`/t/${slug}/admin/news`} className="rounded px-3 py-2 hover:bg-gray-100">
            News
          </Link>
          <Link href={`/t/${slug}/admin/blasts`} className="rounded px-3 py-2 hover:bg-gray-100">
            Blast Center
          </Link>
          <Link href={`/t/${slug}/admin/classifieds`} className="rounded px-3 py-2 hover:bg-gray-100">
            Classified Approvals
          </Link>
          <Link href={`/t/${slug}/admin/invoices`} className="rounded px-3 py-2 hover:bg-gray-100">
            Dues & Invoices
          </Link>
          <Link href={`/t/${slug}/admin/documents`} className="rounded px-3 py-2 hover:bg-gray-100">
            Documents
          </Link>
        </>
      )}
      {isStaff && (
        <Link href={`/t/${slug}/admin/maintenance`} className="rounded px-3 py-2 hover:bg-gray-100">
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
