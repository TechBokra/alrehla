'use client';

import PageComponent from '@/page-views/admin/AdminContentManagementPage';
import PermissionGate from '@/components/auth/PermissionGate';

export default function RoutePage() {
  return (
    <PermissionGate permission="canManageSiteContent">
      <PageComponent />
    </PermissionGate>
  );
}
