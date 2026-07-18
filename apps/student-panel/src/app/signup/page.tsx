import { AuthForm } from '@/components/auth/AuthForm';

export default function StudentSignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-md">
        <AuthForm mode="signup" />
      </div>
    </main>
  );
}
