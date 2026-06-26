import Link from 'next/link';
import { SiteHeader } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="bg-gradient-to-b from-blue-50 to-white py-20">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Modern HOA Management, Built for Scale
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              Run your homeowners association with dues collection, member portals, board tools,
              and community communications — all in one multi-tenant SaaS platform.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link href="/signup">
                <Button size="lg">Start your HOA</Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Member Login
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="mb-8 text-center text-2xl font-bold">Everything your HOA needs</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: 'Dues & Payments',
                desc: 'Stripe-powered invoicing, online payments, and collection metrics.',
              },
              {
                title: 'Member Portal',
                desc: 'Dashboard, statements, maintenance requests, and classifieds.',
              },
              {
                title: 'Board Tools',
                desc: 'Applications, news, email blasts, document management, and more.',
              },
            ].map((f) => (
              <Card key={f.title}>
                <CardHeader>
                  <CardTitle>{f.title}</CardTitle>
                  <CardDescription>{f.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-t bg-white py-12">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <p className="text-gray-600">
              Demo communities:{' '}
              <Link href="/t/whisper-groves" className="text-blue-600 hover:underline">
                Whisper Groves
              </Link>{' '}
              ·{' '}
              <Link href="/t/lakeside" className="text-blue-600 hover:underline">
                Lakeside HOA
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
