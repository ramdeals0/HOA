'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { TenantPublicShell } from '@/components/layout/tenant-public-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { tenantApi } from '@/lib/api';

export default function MembershipPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    propertyAddress: '',
    lotNumber: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await tenantApi(slug, '/applications', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    }
  }

  return (
    <TenantPublicShell
      slug={slug}
      title="Request Membership"
      description="Apply to join this homeowners association."
      maxWidth="lg"
    >
      {submitted ? (
        <Card>
          <CardContent className="py-8 text-center">
            <h2 className="text-xl font-semibold text-green-700">Application Submitted!</h2>
            <p className="mt-2 text-gray-600">The board will review your application shortly.</p>
            <Link href={`/t/${slug}`}>
              <Button className="mt-4" variant="outline">
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Membership Application</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
                <Input placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
              </div>
              <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input placeholder="Property address" value={form.propertyAddress} onChange={(e) => setForm({ ...form, propertyAddress: e.target.value })} required />
              <Input placeholder="Lot number" value={form.lotNumber} onChange={(e) => setForm({ ...form, lotNumber: e.target.value })} />
              <Textarea placeholder="Message (optional)" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full">Submit Application</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </TenantPublicShell>
  );
}
