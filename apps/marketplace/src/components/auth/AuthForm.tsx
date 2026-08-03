'use client';

import * as React from 'react';
import { ClerkAuthForm } from '@alrehla/ui/auth';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '../../contexts/AuthContext';
import type { UserProfile, UserRole } from '../../lib/database.types';
import {
  getOAuthRedirectPath,
  getPostAuthRedirectPath,
  isExternalUrl,
  normalizeInternalRedirect,
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
  const searchParams = useSearchParams();
  const requestedPath = normalizeInternalRedirect(searchParams.get('redirect_url'));

  const preferredPath = redirectTo || requestedPath;

  const handleAuthenticated = async (user: UserProfile) => {
    if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
      await auth.signOut();
      throw new Error('غير مسموح لهذا النوع من الحسابات بالدخول من هذه البوابة.');
    }

    const target = getPostAuthRedirectPath(user, preferredPath);
    if (isExternalUrl(target)) {
      window.location.assign(target);
      return;
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
      onForgotPassword={() => router.push('/reset-password')}
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
