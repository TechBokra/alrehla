import { SignIn } from '@clerk/nextjs';

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <SignIn
        routing="path"
        path="/reset-password"
        signUpUrl="/signup"
        fallbackRedirectUrl="/auth/redirect"
      />
    </main>
  );
}
