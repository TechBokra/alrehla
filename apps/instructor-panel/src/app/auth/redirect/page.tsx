'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageLoader from '@alrehla/ui/page-loader';
import { Button } from '@alrehla/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getPostAuthRedirectPath } from '@/lib/dashboardRedirect';
import AuthStatePanel from '@/components/auth/AuthStatePanel';

export default function AuthRedirectPage() {
  const router = useRouter();
  const {
    currentUser,
    isLoggedIn,
    loading,
    authStatus,
    error,
    retryAuthSync,
    signOut,
  } = useAuth();
  const [nextPath, setNextPath] = useState<string | null>(null);
  const [queryReady, setQueryReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextPath(params.get('next'));
    setQueryReady(true);
  }, []);

  useEffect(() => {
    if (loading || authStatus === 'loading' || !queryReady || authStatus === 'error') return;

    if (authStatus === 'unauthenticated' || !isLoggedIn || !currentUser) {
      router.replace('/login');
      return;
    }

    const target = getPostAuthRedirectPath(currentUser, nextPath);
    if (!target) {
      void signOut().finally(() => router.replace('/login?error=unauthorized'));
      return;
    }

    router.replace(target);
  }, [authStatus, currentUser, isLoggedIn, loading, nextPath, queryReady, router, signOut]);

  if (authStatus === 'error') {
    return (
      <AuthStatePanel
        title="تم تسجيل الدخول لكن تعذر تجهيز الحساب"
        message={error || 'تعذر مزامنة بيانات حساب المدرب مع قاعدة البيانات.'}
        onRetry={retryAuthSync}
        action={
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              void signOut().then(() => router.replace('/login'));
            }}
          >
            تسجيل الخروج والعودة
          </Button>
        }
      />
    );
  }

  return <PageLoader text="جاري تجهيز حسابك..." />;
}
