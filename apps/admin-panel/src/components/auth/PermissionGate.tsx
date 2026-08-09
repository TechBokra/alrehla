'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageLoader from '@alrehla/ui/page-loader';
import { useAuth } from '@/contexts/AuthContext';
import type { Permissions } from '@/lib/roles';

export default function PermissionGate({
  children,
  permission,
}: {
  children: React.ReactNode;
  permission: keyof Permissions;
}) {
  const router = useRouter();
  const { permissions, loading } = useAuth();

  useEffect(() => {
    if (!loading && !permissions[permission]) {
      router.replace('/');
    }
  }, [loading, permission, permissions, router]);

  if (loading) {
    return <PageLoader text="جاري التحقق من الصلاحيات..." />;
  }

  if (!permissions[permission]) {
    return null;
  }

  return <>{children}</>;
}
