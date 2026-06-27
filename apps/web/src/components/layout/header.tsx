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

export { PortalNav } from '@/components/layout/portal-nav';
