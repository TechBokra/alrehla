'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageLoader from '@alrehla/ui/page-loader';
import { Button } from '@alrehla/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import AuthStatePanel from './AuthStatePanel';

export default function AdminAccessGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const {
    currentUser,
    hasAdminAccess,
    isLoggedIn,
    loading,
    authStatus,
    error,
    retryAuthSync,
    signOut,
  } = useAuth();

  useEffect(() => {
    if (loading || authStatus === 'loading' || authStatus === 'error') return;
    if (authStatus === 'unauthenticated' || !isLoggedIn) {
      router.replace('/login');
    }
  }, [authStatus, isLoggedIn, loading, router]);

  if (loading || authStatus === 'loading') {
    return <PageLoader text="جاري التحقق من الصلاحيات..." />;
  }

  if (authStatus === 'error') {
    return (
      <AuthStatePanel
        title="تعذر التحقق من حسابك"
        message={error || 'تعذر إكمال مزامنة الحساب مع قاعدة البيانات.'}
        onRetry={retryAuthSync}
        action={
          <Button type="button" variant="ghost" onClick={() => void signOut()}>
            تسجيل الخروج
          </Button>
        }
      />
    );
  }

  if (authStatus === 'unauthenticated' || !isLoggedIn) {
    return null;
  }

  if (!currentUser || !hasAdminAccess) {
    return (
      <AuthStatePanel
        title="لا تملك صلاحية الدخول إلى لوحة الإدارة"
        message="تم تسجيل الدخول، لكن هذا الحساب لا يملك دوراً إدارياً فعالاً. استخدم حساباً مصرحاً به أو تواصل مع مدير النظام."
        action={
          <Button type="button" variant="outline" onClick={() => void signOut()}>
            تسجيل الخروج
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
