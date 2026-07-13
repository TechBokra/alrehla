export const dynamic = 'force-dynamic';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import StudentLayout from '@/components/student/StudentLayout';
import StudentPortfolioPage from '@/features/student-portfolio';

export default function Page() {
  return (
    <ProtectedRoute studentOnly>
      <StudentLayout>
        <StudentPortfolioPage />
      </StudentLayout>
    </ProtectedRoute>
  );
}
