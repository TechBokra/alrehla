export const dynamic = 'force-dynamic';

import Login from '@/components/auth/login';

export default function Page() {
  return (
    <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[70vh]">
      <div className="w-full max-w-md">
        <Login />
      </div>
    </div>
  );
}
