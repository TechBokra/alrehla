import AdminLayout from '@/components/admin/AdminLayout';
import AdminAccessGuard from '@/components/auth/AdminAccessGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAccessGuard>
      <AdminLayout>{children}</AdminLayout>
    </AdminAccessGuard>
  );
}
