export const dynamic = 'force-dynamic';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TrainingJourneyPage from '@/features/journey';

export default function Page() {
  return (
    <ProtectedRoute>
      <TrainingJourneyPage />
    </ProtectedRoute>
  );
}
