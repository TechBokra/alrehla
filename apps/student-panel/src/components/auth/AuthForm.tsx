'use client';

import * as React from 'react';
import { ClerkAuthForm } from '@alrehla/ui/auth';

import { useAuth } from '../../contexts/AuthContext';
import type { UserProfile, UserRole } from '../../lib/database.types';
import { redirectToAdminPanel } from '../../lib/adminPanelUrl';
import { getMarketplaceUrl, redirectToMarketplace } from '../../lib/marketplaceUrl';
import { useLocation, useNavigate } from '../../lib/router-compat';

interface AuthFormProps {
  mode: 'login' | 'signup';
  redirectTo?: string;
  allowedRoles?: UserRole[];
  disableSignup?: boolean;
}

const STUDENT_ROLES: UserRole[] = ['student'];

export function AuthForm({
  mode,
  redirectTo,
  allowedRoles = STUDENT_ROLES,
  disableSignup = false,
}: AuthFormProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryRedirect = new URLSearchParams(location.search).get('redirect_url');
  const stateRedirect = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  const requestedPath = redirectTo || queryRedirect || stateRedirect;
  const preferredPath =
    requestedPath &&
    requestedPath.startsWith('/') &&
    !requestedPath.startsWith('//') &&
    !requestedPath.includes('/login') &&
    !requestedPath.includes('/signup')
      ? requestedPath
      : '/dashboard';

  const handleAuthenticated = async (user: UserProfile) => {
    if (!allowedRoles.includes(user.role)) {
      await auth.signOut();
      throw new Error('لوحة الطالب متاحة للحسابات الطلابية فقط.');
    }

    if (user.role === 'student') {
      navigate(preferredPath, { replace: true });
      return;
    }

    if (['super_admin', 'instructor', 'general_supervisor', 'publisher'].includes(user.role)) {
      redirectToAdminPanel();
      return;
    }

    redirectToMarketplace('/account');
  };

  return (
    <ClerkAuthForm<UserProfile>
      mode={mode}
      signupRole="student"
      disableSignup={disableSignup}
      allowModeSwitch={!disableSignup}
      googleRedirectUrl={preferredPath}
      onAuthenticated={handleAuthenticated}
      onForgotPassword={() => window.location.assign(getMarketplaceUrl('/reset-password'))}
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
