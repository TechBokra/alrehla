'use client';

import * as React from 'react';
import { useClerk, useSignIn, useSignUp } from '@clerk/nextjs';
import { AlertCircle, LoaderCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Card, CardContent } from '../ui/card';

export interface ClerkOAuthCallbackProps {
  defaultRedirectUrl: string;
  signInUrl?: string;
  continueSignUpUrl?: string;
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return 'تعذر إكمال تسجيل الدخول عبر Google. حاول مرة أخرى.';
};

const normalizeRedirectUrl = (value: string | null, fallback: string) => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback;
  return value;
};

export function ClerkOAuthCallback({
  defaultRedirectUrl,
  signInUrl = '/login',
  continueSignUpUrl = '/signup',
}: ClerkOAuthCallbackProps) {
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasRun = React.useRef(false);
  const [error, setError] = React.useState<string | null>(null);

  const redirectUrl = normalizeRedirectUrl(
    searchParams.get('redirect_url'),
    defaultRedirectUrl,
  );

  const navigate = React.useCallback(
    async ({ session, decorateUrl }: any) => {
      if (session?.currentTask) {
        setError('يتطلب هذا الحساب خطوة أمان إضافية. أكملها من صفحة تسجيل الدخول.');
        return;
      }

      const target = decorateUrl(redirectUrl);
      if (/^https?:\/\//i.test(target)) {
        window.location.assign(target);
      } else {
        router.replace(target);
      }
    },
    [redirectUrl, router],
  );

  React.useEffect(() => {
    if (!clerk.loaded || hasRun.current) return;
    hasRun.current = true;

    const finish = async () => {
      try {
        if (signIn.status === 'complete') {
          await signIn.finalize({ navigate });
          return;
        }

        if (signUp.isTransferable) {
          await signIn.create({ transfer: true });
          if ((signIn.status as string) === 'complete') {
            await signIn.finalize({ navigate });
            return;
          }
          router.replace(signInUrl);
          return;
        }

        if (
          signIn.status === 'needs_first_factor' &&
          !signIn.supportedFirstFactors?.every(
            (factor) => factor.strategy === 'enterprise_sso',
          )
        ) {
          router.replace(signInUrl);
          return;
        }

        if (signIn.isTransferable) {
          await signUp.create({ transfer: true });
          if (signUp.status === 'complete') {
            await signUp.finalize({ navigate });
            return;
          }
          router.replace(continueSignUpUrl);
          return;
        }

        if (signUp.status === 'complete') {
          await signUp.finalize({ navigate });
          return;
        }

        if (
          signIn.status === 'needs_second_factor' ||
          signIn.status === 'needs_new_password'
        ) {
          router.replace(signInUrl);
          return;
        }

        const existingSession = signIn.existingSession || signUp.existingSession;
        if (existingSession?.sessionId) {
          await clerk.setActive({
            session: existingSession.sessionId,
            navigate,
          });
          return;
        }

        throw new Error('لم تكتمل جلسة Clerk بعد العودة من Google.');
      } catch (callbackError) {
        setError(getErrorMessage(callbackError));
      }
    };

    void finish();
  }, [
    clerk,
    continueSignUpUrl,
    navigate,
    router,
    signIn,
    signInUrl,
    signUp,
  ]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <Card className="w-full max-w-md rounded-lg">
        <CardContent className="p-6">
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="size-4" aria-hidden="true" />
              <AlertTitle>تعذر تسجيل الدخول</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div className="flex flex-col items-center gap-3 py-8 text-center" aria-live="polite">
              <LoaderCircle className="size-8 animate-spin text-primary" aria-hidden="true" />
              <h1 className="text-lg font-semibold">جاري إكمال تسجيل الدخول</h1>
              <p className="text-sm text-muted-foreground">
                نتحقق من حساب Google ونجهز جلستك الآمنة.
              </p>
            </div>
          )}
          <div id="clerk-captcha" className="mt-4" />
        </CardContent>
      </Card>
    </main>
  );
}
