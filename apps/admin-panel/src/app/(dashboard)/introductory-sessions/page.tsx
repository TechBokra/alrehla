'use client';

import PageComponent from '@/page-views/admin/AdminIntroductorySessionsPage';
import PermissionGate from '@/components/auth/PermissionGate';

export default function RoutePage() {
  return (
    <PermissionGate permission="canManageInstructors">
      <PageComponent />
    </PermissionGate>
  );
}
