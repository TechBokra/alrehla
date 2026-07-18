'use client';

import type { UserRole } from '../../lib/database.types';
import { AuthForm } from './AuthForm';

interface SignUpProps {
  redirectTo?: string;
  allowedRoles?: UserRole[];
}

export function SignUp(props: SignUpProps) {
  return <AuthForm mode="signup" {...props} />;
}

export default SignUp;
