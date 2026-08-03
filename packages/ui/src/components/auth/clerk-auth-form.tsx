'use client';

import * as React from 'react';
import { AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';

import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Input } from '../ui/input';
import { FormField } from '../forms/form-field';
import { cn } from '../../lib/utils';

export type ClerkAuthMode = 'login' | 'signup';

export interface ClerkAuthUser {
  role: string;
}

export interface ClerkAuthAdapter<TUser extends ClerkAuthUser> {
  signIn: (email: string, password: string) => Promise<TUser | null>;
  signUp: (
    email: string,
    password: string,
    name: string,
    role: string,
  ) => Promise<TUser | null>;
  signInWithGoogle: (redirectUrl: string) => Promise<void>;
  loading: boolean;
  error?: string | null;
  pendingEmailVerification: boolean;
  isClerkEnabled: boolean;
}

export interface ClerkAuthFormProps<TUser extends ClerkAuthUser> {
  adapter: ClerkAuthAdapter<TUser>;
  mode: ClerkAuthMode;
  signupRole?: string;
  googleRedirectUrl: string;
  onAuthenticated: (user: TUser) => Promise<void> | void;
  onForgotPassword?: () => void;
  allowModeSwitch?: boolean;
  disableSignup?: boolean;
  title?: string;
  description?: string;
  className?: string;
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return 'حدث خطأ أثناء المصادقة. حاول مرة أخرى.';
};

export function ClerkAuthForm<TUser extends ClerkAuthUser>({
  adapter,
  mode: initialMode,
  signupRole = 'user',
  googleRedirectUrl,
  onAuthenticated,
  onForgotPassword,
  allowModeSwitch = true,
  disableSignup = false,
  title,
  description,
  className,
}: ClerkAuthFormProps<TUser>) {
  const [mode, setMode] = React.useState<ClerkAuthMode>(initialMode);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [redirecting, setRedirecting] = React.useState(false);

  React.useEffect(() => {
    setMode(initialMode);
    setLocalError(null);
  }, [initialMode]);

  const isLogin = mode === 'login';
  const busy = adapter.loading || googleLoading || redirecting;
  const visibleError = localError || adapter.error;

  const finishAuthentication = async (user: TUser | null) => {
    if (!user) return;

    setRedirecting(true);
    try {
      await onAuthenticated(user);
    } catch (error) {
      setLocalError(getErrorMessage(error));
      setRedirecting(false);
    }
  };

  const handleCredentials = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const user = isLogin
        ? await adapter.signIn(normalizedEmail, password)
        : await adapter.signUp(normalizedEmail, password, name.trim(), signupRole);
      await finishAuthentication(user);
    } catch (error) {
      setLocalError(getErrorMessage(error));
    }
  };

  const handleGoogle = async () => {
    setLocalError(null);
    setGoogleLoading(true);

    try {
      await adapter.signInWithGoogle(googleRedirectUrl);
    } catch (error) {
      setLocalError(getErrorMessage(error));
      setGoogleLoading(false);
    }
  };

  if (adapter.pendingEmailVerification) {
    return (
      <Card className={cn('w-full rounded-lg', className)}>
        <CardHeader className="text-center">
          <span className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="size-6" aria-hidden="true" />
          </span>
          <CardTitle className="text-xl">تأكيد البريد الإلكتروني</CardTitle>
          <CardDescription>
            افتح رابط التحقق الذي أرسله Clerk إلى بريدك الإلكتروني لإكمال إنشاء الحساب.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visibleError && <AuthError message={visibleError} />}
          <p className="text-center text-sm text-muted-foreground">
            لا توجد خطوة إدخال رمز. بعد فتح الرابط سيعود Clerk إلى التطبيق تلقائياً.
          </p>
          {adapter.isClerkEnabled && <div id="clerk-captcha" className="mt-4" />}
        </CardContent>
      </Card>
    );
  }

  const heading = title || (isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد');
  const supportingText =
    description ||
    (isLogin
      ? 'أدخل بيانات حسابك للمتابعة.'
      : 'أنشئ حسابك بالبريد الإلكتروني أو Google.');

  return (
    <Card className={cn('w-full rounded-lg', className)}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{heading}</CardTitle>
        <CardDescription>{supportingText}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogle}
          loading={googleLoading}
          disabled={busy}
        >
          {!googleLoading && (
            <span
              className="flex size-5 items-center justify-center rounded-sm border bg-background text-xs font-bold text-foreground"
              aria-hidden="true"
            >
              G
            </span>
          )}
          {isLogin ? 'المتابعة باستخدام Google' : 'إنشاء حساب باستخدام Google'}
        </Button>

        <div className="relative" role="separator" aria-label="أو بالبريد الإلكتروني">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-3 text-muted-foreground">أو بالبريد الإلكتروني</span>
          </div>
        </div>

        <form onSubmit={handleCredentials} className="space-y-4">
          {!isLogin && (
            <FormField label="الاسم الكامل" htmlFor="clerk-auth-name" required>
              <Input
                id="clerk-auth-name"
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="الاسم الكامل"
                required
                disabled={busy}
              />
            </FormField>
          )}

          <FormField label="البريد الإلكتروني" htmlFor="clerk-auth-email" required>
            <Input
              id="clerk-auth-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              required
              disabled={busy}
              dir="ltr"
              className="text-left"
            />
          </FormField>

          <FormField label="كلمة المرور" htmlFor="clerk-auth-password" required>
            <div className="relative">
              <Input
                id="clerk-auth-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                disabled={busy}
                dir="ltr"
                className="pe-10 text-left"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 end-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                aria-pressed={showPassword}
                disabled={busy}
              >
                {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </button>
            </div>
          </FormField>

          {isLogin && onForgotPassword && (
            <div className="text-left">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                disabled={busy}
              >
                نسيت كلمة المرور؟
              </button>
            </div>
          )}

          {visibleError && <AuthError message={visibleError} />}

          <Button type="submit" className="w-full" loading={busy} disabled={busy}>
            {isLogin ? 'دخول' : 'إنشاء حساب'}
          </Button>
        </form>

        {allowModeSwitch && !disableSignup && (
          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(isLogin ? 'signup' : 'login');
                setLocalError(null);
              }}
              className="font-semibold text-primary underline-offset-4 hover:underline"
              disabled={busy}
            >
              {isLogin ? 'أنشئ حسابًا' : 'سجل الدخول'}
            </button>
          </p>
        )}

        {adapter.isClerkEnabled && <div id="clerk-captcha" />}
      </CardContent>
    </Card>
  );
}

function AuthError({ message }: { message: string }) {
  return (
    <Alert variant="destructive" aria-live="polite">
      <AlertCircle className="size-4" aria-hidden="true" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export type ClerkSignInFormProps<TUser extends ClerkAuthUser> = Omit<
  ClerkAuthFormProps<TUser>,
  'mode'
>;

export function ClerkSignInForm<TUser extends ClerkAuthUser>(
  props: ClerkSignInFormProps<TUser>,
) {
  return <ClerkAuthForm {...props} mode="login" />;
}

export type ClerkSignUpFormProps<TUser extends ClerkAuthUser> = Omit<
  ClerkAuthFormProps<TUser>,
  'mode'
>;

export function ClerkSignUpForm<TUser extends ClerkAuthUser>(
  props: ClerkSignUpFormProps<TUser>,
) {
  return <ClerkAuthForm {...props} mode="signup" />;
}
