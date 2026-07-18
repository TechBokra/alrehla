'use client';

import PageComponent from '@/page-views/admin/AdminJoinRequestDetailPage';
import PermissionGate from '@/components/auth/PermissionGate';

export default function RoutePage() {
  return (
    <PermissionGate permission="canManageJoinRequests">
      <PageComponent />
    </PermissionGate>
  );
}
