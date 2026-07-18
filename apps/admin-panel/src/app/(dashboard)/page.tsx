'use client';

import AdminDashboardPage from '@/page-views/admin/AdminDashboardPage';
import InstructorDashboardPage from '@/page-views/admin/instructor/InstructorDashboardPage';
import PublisherDashboardPage from '@/page-views/admin/publisher/PublisherDashboardPage';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { permissions } = useAuth();

  if (permissions.canViewGlobalStats) return <AdminDashboardPage />;
  if (permissions.isInstructor) return <InstructorDashboardPage />;
  if (permissions.isPublisher) return <PublisherDashboardPage />;

  return <AdminDashboardPage />;
}
