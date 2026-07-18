'use client';

import type { UserRole } from '../../lib/database.types';
import { AuthForm } from './AuthForm';

interface LoginProps {
  redirectTo?: string;
  allowedRoles?: UserRole[];
}

export function Login(props: LoginProps) {
  return <AuthForm mode="login" {...props} />;
}

export default Login;
