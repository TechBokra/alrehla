'use client';

import * as React from 'react';
import { ClerkAuthForm } from '@alrehla/ui/auth';

import { useAuth } from '../../contexts/AuthContext';
import type { UserProfile, UserRole } from '../../lib/database.types';
import {
  getOAuthRedirectPath,
  getPostAuthRedirectPath,
  isExternalUrl,
} from '../../lib/dashboardRedirect';
import { useLocation, useNavigate } from '../../lib/router-compat';

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
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  const preferredPath =
    redirectTo ||
    (from && !from.includes('/login') && !from.includes('/signup') ? from : null);

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

    navigate(target, { replace: true });
  };

  return (
    <ClerkAuthForm<UserProfile>
      mode={mode}
      signupRole="user"
      disableSignup={disableSignup}
      allowModeSwitch={!disableSignup}
      googleRedirectUrl={getOAuthRedirectPath(preferredPath)}
      onAuthenticated={handleAuthenticated}
      onForgotPassword={() => navigate('/reset-password')}
      adapter={{
        signIn: auth.signIn,
        signUp: auth.signUp,
        signInWithGoogle: auth.signInWithGoogle,
        verifySignUpEmail: auth.verifySignUpEmail,
        loading: auth.loading,
        error: auth.error,
        pendingEmailVerification: auth.pendingEmailVerification,
        isClerkEnabled: auth.isClerkEnabled,
      }}
    />
  );
}

export default AuthForm;
