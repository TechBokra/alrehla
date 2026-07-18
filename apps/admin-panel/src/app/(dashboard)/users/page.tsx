'use client';

import PageComponent from '@/page-views/admin/AdminUsersPage';
import PermissionGate from '@/components/auth/PermissionGate';

export default function RoutePage() {
  return (
    <PermissionGate permission="canManageUsers">
      <PageComponent />
    </PermissionGate>
  );
}
