export const dynamic = 'force-dynamic';

import SignUp from '@/components/auth/signup';

export default function Page() {
  return (
    <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[70vh]">
      <div className="w-full max-w-md">
        <SignUp />
      </div>
    </div>
  );
}
