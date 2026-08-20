import InstructorLayout from '@/components/instructor/InstructorLayout';
import InstructorAccessGuard from '@/components/auth/InstructorAccessGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <InstructorAccessGuard>
      <InstructorLayout>{children}</InstructorLayout>
    </InstructorAccessGuard>
  );
}
