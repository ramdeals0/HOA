'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const STEPS = ['Basic Info', 'Import Properties', 'Invite Board Members'];

export default function OnboardingPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.tenantSlug as string;
  const [step, setStep] = useState(0);

  function finish() {
    router.push(`/t/${slug}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-bold">Welcome! Let&apos;s set up your HOA</h1>
      <div className="mt-4 flex gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className={`rounded-full px-3 py-1 text-sm ${i === step ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            {i + 1}. {s}
          </div>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader><CardTitle>{STEPS[step]}</CardTitle></CardHeader>
        <CardContent>
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-gray-600">Your community portal is ready. You can customize branding and dues from the board admin panel.</p>
              <Button onClick={() => setStep(1)}>Continue</Button>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-gray-600">CSV property import coming soon. For now, add properties manually from the admin panel.</p>
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-gray-400">
                Drop CSV file here (placeholder)
              </div>
              <Button onClick={() => setStep(2)}>Continue</Button>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-gray-600">Invite board members by email from the admin panel. They will receive an invitation link.</p>
              <Button onClick={finish}>Go to Community Home</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
