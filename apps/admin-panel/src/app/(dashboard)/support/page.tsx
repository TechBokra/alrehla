'use client';

import PageComponent from '@/page-views/admin/AdminSupportPage';
import PermissionGate from '@/components/auth/PermissionGate';

export default function RoutePage() {
  return (
    <PermissionGate permission="canManageSupportTickets">
      <PageComponent />
    </PermissionGate>
  );
}
