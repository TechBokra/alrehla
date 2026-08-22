'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import PageLoader from '@alrehla/ui/page-loader';
import { Button } from '@alrehla/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import type { Permissions } from '@/lib/roles';
import AuthStatePanel from './AuthStatePanel';

export default function PermissionGate({
  children,
  permission,
}: {
  children: React.ReactNode;
  permission: keyof Permissions;
}) {
  const router = useRouter();
  const {
    permissions,
    loading,
    authStatus,
    error,
    retryAuthSync,
    signOut,
  } = useAuth();

  React.useEffect(() => {
    if (!loading && authStatus === 'unauthenticated') {
      router.replace('/login');
    }
  }, [authStatus, loading, router]);

  if (loading || authStatus === 'loading') {
    return <PageLoader text="جاري التحقق من الصلاحيات..." />;
  }

  if (authStatus === 'error') {
    return (
      <AuthStatePanel
        title="تعذر التحقق من الصلاحيات"
        message={error || 'تعذر قراءة صلاحيات الحساب من مصدر الهوية.'}
        onRetry={retryAuthSync}
        action={
          <Button type="button" variant="ghost" onClick={() => void signOut()}>
            تسجيل الخروج
          </Button>
        }
      />
    );
  }

  if (authStatus === 'unauthenticated') {
    return null;
  }

  if (!permissions[permission]) {
    return (
      <AuthStatePanel
        title="لا تملك الصلاحية المطلوبة"
        message="حسابك مسجل الدخول، لكن لا يملك الإذن لعرض هذه الصفحة."
        action={
          <Button type="button" onClick={() => router.replace('/')}>
            العودة للوحة الرئيسية
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
