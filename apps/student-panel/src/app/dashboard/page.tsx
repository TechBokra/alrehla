export const dynamic = 'force-dynamic';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import StudentLayout from '@/components/student/StudentLayout';
import StudentDashboardPage from '@/features/student-dashboard';

export default function DashboardPage() {
  return (
    <ProtectedRoute studentOnly>
      <StudentLayout>
        <StudentDashboardPage />
      </StudentLayout>
    </ProtectedRoute>
  );
}
