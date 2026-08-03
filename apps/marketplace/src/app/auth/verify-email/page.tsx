'use client';

import { useClerk } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function VerifyEmailPage() {
  const clerk = useClerk();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void clerk
      .handleEmailLinkVerification({
        redirectUrlComplete: `${window.location.origin}/auth/redirect`,
        redirectUrl: `${window.location.origin}/auth/redirect`,
        onVerifiedOnOtherDevice: () => {
          if (!cancelled) setError('تم التحقق من البريد على جهاز آخر. سجّل الدخول للمتابعة.');
        },
      })
      .catch((verificationError: unknown) => {
        if (!cancelled) {
          setError(
            verificationError instanceof Error
              ? verificationError.message
              : 'تعذر إكمال رابط التحقق.',
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [clerk]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <div className="max-w-md space-y-3">
        <h1 className="text-2xl font-semibold">جارٍ تأكيد البريد الإلكتروني</h1>
        <p className="text-muted-foreground">
          إذا فتحت الرابط من الجهاز نفسه، سيعيدك Clerk إلى التطبيق تلقائياً.
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </main>
  );
}
