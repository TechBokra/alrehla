export const dynamic = 'force-dynamic';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import CreativeWritingBookingPage from '@/features/creative-writing-booking';

export default function Page() {
  return (
    <ProtectedRoute>
      <CreativeWritingBookingPage />
    </ProtectedRoute>
  );
}
