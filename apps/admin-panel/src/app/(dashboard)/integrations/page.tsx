'use client';

import PageComponent from '@/page-views/admin/AdminIntegrationsPage';
import PermissionGate from '@/components/auth/PermissionGate';

export default function RoutePage() {
  return (
    <PermissionGate permission="canManageSettings">
      <PageComponent />
    </PermissionGate>
  );
}
