'use client';

import * as React from 'react';
import { ClerkAuthForm } from '@alrehla/ui/auth';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '../../contexts/AuthContext';
import type { UserProfile, UserRole } from '../../lib/database.types';
import {
  getOAuthRedirectPath,
  getPostAuthRedirectPath,
} from '../../lib/dashboardRedirect';

interface AuthFormProps {
  mode: 'login' | 'signup';
  redirectTo?: string;
  allowedRoles?: UserRole[];
  disableSignup?: boolean;
}

export function AuthForm({
  mode,
  redirectTo,
  allowedRoles,
  disableSignup = false,
}: AuthFormProps) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedPath = searchParams.get('redirect_url');
  const preferredPath =
    (requestedPath && !requestedPath.includes('/login') ? requestedPath : null) ||
    redirectTo ||
    (pathname !== '/login' ? pathname : null);

  const handleAuthenticated = async (user: UserProfile) => {
    if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
      await auth.signOut();
      throw new Error('غير مسموح لهذا النوع من الحسابات بالدخول من هذه البوابة.');
    }

    const target = getPostAuthRedirectPath(user, preferredPath);
    if (!target) {
      await auth.signOut();
      throw new Error('هذا الحساب لا يملك صلاحية دخول لوحة الإدارة.');
    }

    router.replace(target);
  };

  return (
    <ClerkAuthForm<UserProfile>
      mode={mode}
      signupRole="user"
      disableSignup={disableSignup}
      allowModeSwitch={!disableSignup}
      googleRedirectUrl={getOAuthRedirectPath(preferredPath)}
      onAuthenticated={handleAuthenticated}
      adapter={{
        signIn: auth.signIn,
        signUp: auth.signUp,
        signInWithGoogle: auth.signInWithGoogle,
        loading: auth.loading,
        error: auth.error,
        pendingEmailVerification: auth.pendingEmailVerification,
        isClerkEnabled: auth.isClerkEnabled,
      }}
    />
  );
}

export default AuthForm;
