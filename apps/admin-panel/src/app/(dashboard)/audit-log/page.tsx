'use client';

import PageComponent from '@/page-views/admin/AdminAuditLogPage';
import PermissionGate from '@/components/auth/PermissionGate';

export default function RoutePage() {
  return (
    <PermissionGate permission="canViewAuditLog">
      <PageComponent />
    </PermissionGate>
  );
}
