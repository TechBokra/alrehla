'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageLoader from '@alrehla/ui/page-loader';
import { useAuth } from '@/contexts/AuthContext';
import { getPostAuthRedirectPath } from '@/lib/dashboardRedirect';

export default function AuthRedirectPage() {
  const router = useRouter();
  const { currentUser, isLoggedIn, loading, signOut } = useAuth();
  const [nextPath, setNextPath] = useState<string | null>(null);
  const [queryReady, setQueryReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextPath(params.get('next'));
    setQueryReady(true);
  }, []);

  useEffect(() => {
    if (loading || !queryReady) return;

    if (!isLoggedIn || !currentUser) {
      router.replace('/login');
      return;
    }

    const target = getPostAuthRedirectPath(currentUser, nextPath);
    if (!target) {
      void signOut().finally(() => router.replace('/login?error=unauthorized'));
      return;
    }

    router.replace(target);
  }, [currentUser, isLoggedIn, loading, nextPath, queryReady, router, signOut]);

  return <PageLoader text="جاري تجهيز حسابك..." />;
}
