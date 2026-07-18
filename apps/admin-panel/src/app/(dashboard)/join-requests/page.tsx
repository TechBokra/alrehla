'use client';

import PageComponent from '@/page-views/admin/AdminJoinRequestsPage';
import PermissionGate from '@/components/auth/PermissionGate';

export default function RoutePage() {
  return (
    <PermissionGate permission="canManageJoinRequests">
      <PageComponent />
    </PermissionGate>
  );
}
