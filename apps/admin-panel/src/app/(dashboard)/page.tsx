'use client';

import AdminDashboardPage from '@/page-views/admin/AdminDashboardPage';
import PublisherDashboardPage from '@/page-views/admin/publisher/PublisherDashboardPage';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { permissions } = useAuth();

  if (permissions.isPublisher) return <PublisherDashboardPage />;

  return <AdminDashboardPage />;
}
