export const dynamic = 'force-dynamic';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import StudentLayout from '@/components/student/StudentLayout';
import StudentDashboardPage from '@/features/student-dashboard';

export default function Page() {
  return (
    <ProtectedRoute studentOnly>
      <StudentLayout>
        <StudentDashboardPage />
      </StudentLayout>
    </ProtectedRoute>
  );
}
