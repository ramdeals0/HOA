'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PaymentSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.tenantSlug as string;
  const sessionId = searchParams.get('session_id');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-green-700">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Thank you for your payment. A receipt has been sent to your email.</p>
          {sessionId && <p className="mt-2 text-xs text-gray-400">Session: {sessionId}</p>}
          <Link href={`/t/${slug}/portal/payments`}>
            <Button className="mt-4 w-full">View Payment History</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
