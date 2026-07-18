export const dynamic = 'force-dynamic';

import ForgetPassword from '@/components/auth/forget_password';

export default function Page() {
  return (
    <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[70vh]">
      <div className="w-full max-w-md">
        <ForgetPassword />
      </div>
    </div>
  );
}
