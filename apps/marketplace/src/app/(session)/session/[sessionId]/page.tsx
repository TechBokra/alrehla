export const dynamic = 'force-dynamic';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SessionPage from '@/features/session';

export default function Page() {
  return (
    <ProtectedRoute>
      <SessionPage />
    </ProtectedRoute>
  );
}
