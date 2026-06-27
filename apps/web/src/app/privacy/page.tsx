import Link from 'next/link';
import { SiteHeader } from '@/components/layout/header';
import { SiteFooter } from '@/components/layout/site-footer';
import { HOA_MANAGEMENT_CONTACT, HOA_MANAGEMENT_EMAIL, HOA_MANAGEMENT_NAME } from '@/lib/site-info';

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="mt-2 text-sm text-gray-500">Last updated: June 26, 2026</p>

          <div className="prose prose-gray mt-8 max-w-none space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900">Introduction</h2>
              <p>
                This Privacy Policy describes how {HOA_MANAGEMENT_NAME} (&quot;we,&quot; &quot;us,&quot; or
                &quot;our&quot;) collects, uses, and protects personal information when you use the HOA Portal
                SaaS platform and related community websites (the &quot;Service&quot;).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Information We Collect</h2>
              <p>We may collect the following types of information:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Account information such as name, email address, phone number, and login credentials</li>
                <li>Community membership details, property address, and role within your HOA</li>
                <li>Payment and billing information processed through our payment providers</li>
                <li>Content you submit, including maintenance requests, classified listings, and votes</li>
                <li>Usage data such as pages visited, device type, browser, and IP address</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">How We Use Your Information</h2>
              <p>We use personal information to:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Provide and maintain the Service for your homeowners association</li>
                <li>Process dues, invoices, and membership applications</li>
                <li>Send community communications authorized by your HOA board</li>
                <li>Improve security, troubleshoot issues, and analyze platform usage</li>
                <li>Comply with legal obligations and enforce our terms</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Information Sharing</h2>
              <p>
                We do not sell your personal information. We may share information with service providers who
                help us operate the platform (such as hosting, email, and payment processors), with your HOA
                board or managers as needed to administer community services, and when required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Cookies and Similar Technologies</h2>
              <p>
                We use cookies and similar technologies to keep you signed in, remember preferences, and
                understand how the Service is used. You can control cookies through your browser settings,
                though some features may not function properly if cookies are disabled.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Data Security</h2>
              <p>
                We use reasonable administrative, technical, and physical safeguards designed to protect
                personal information. No method of transmission over the Internet or electronic storage is
                completely secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Your Choices and Rights</h2>
              <p>
                Depending on your location, you may have rights to access, correct, delete, or restrict use of
                your personal information. HOA members can update profile details in the portal and manage
                directory privacy settings where available. To make a privacy request, contact us using the
                information below.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Children&apos;s Privacy</h2>
              <p>
                The Service is intended for adults managing or participating in homeowners associations. We do
                not knowingly collect personal information from children under 13.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will post the revised policy on this
                page and update the &quot;Last updated&quot; date above.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy or our privacy practices, contact{' '}
                {HOA_MANAGEMENT_CONTACT} at{' '}
                <a href={`mailto:${HOA_MANAGEMENT_EMAIL}`} className="text-blue-600 hover:underline">
                  {HOA_MANAGEMENT_EMAIL}
                </a>
                .
              </p>
            </section>
          </div>

          <p className="mt-10 text-sm text-gray-500">
            <Link href="/" className="text-blue-600 hover:underline">
              Back to home
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
