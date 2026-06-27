import Link from 'next/link';
import { HOA_MANAGEMENT_CONTACT, HOA_MANAGEMENT_EMAIL, HOA_MANAGEMENT_NAME } from '@/lib/site-info';

export function SiteFooter() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-gray-900">Contact</p>
          <p className="mt-1">{HOA_MANAGEMENT_NAME}</p>
          <a href={`mailto:${HOA_MANAGEMENT_EMAIL}`} className="mt-1 inline-block text-blue-600 hover:underline">
            {HOA_MANAGEMENT_EMAIL}
          </a>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <Link href="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </Link>
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} {HOA_MANAGEMENT_CONTACT}</p>
        </div>
      </div>
    </footer>
  );
}
