'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageLoader from '@alrehla/ui/page-loader';
import { Button } from '@alrehla/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import AuthStatePanel from './AuthStatePanel';

export default function InstructorAccessGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const {
    currentUser,
    hasInstructorAccess,
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
    return <PageLoader text="جاري التحقق من صلاحيات المدرب..." />;
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

  if (!currentUser || !hasInstructorAccess) {
    return (
      <AuthStatePanel
        title="لا تملك صلاحية الدخول إلى لوحة المدربين"
        message="تم تسجيل الدخول، لكن هذا الحساب غير مسجل كمدرب معتمد. يرجى استخدام حساب المدرب الخاص بك أو التواصل مع الإدارة."
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
