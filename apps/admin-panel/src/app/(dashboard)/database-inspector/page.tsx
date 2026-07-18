'use client';

import PageComponent from '@/page-views/admin/AdminDatabaseInspectorPage';
import PermissionGate from '@/components/auth/PermissionGate';

export default function RoutePage() {
  return (
    <PermissionGate permission="canManageSettings">
      <PageComponent />
    </PermissionGate>
  );
}
