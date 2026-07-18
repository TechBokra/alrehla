'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageLoader from '@alrehla/ui/page-loader';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminAccessGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { currentUser, hasAdminAccess, isLoggedIn, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!isLoggedIn || !currentUser || !hasAdminAccess) {
      router.replace('/login');
    }
  }, [currentUser, hasAdminAccess, isLoggedIn, loading, router]);

  if (loading || !isLoggedIn || !currentUser || !hasAdminAccess) {
    return <PageLoader text="جاري التحقق من الصلاحيات..." />;
  }

  return <>{children}</>;
}
