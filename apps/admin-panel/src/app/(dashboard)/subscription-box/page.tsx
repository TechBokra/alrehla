'use client';

import PageComponent from '@/page-views/admin/AdminSubscriptionBoxPage';
import PermissionGate from '@/components/auth/PermissionGate';

export default function RoutePage() {
  return (
    <PermissionGate permission="canManageEnhaLakProducts">
      <PageComponent />
    </PermissionGate>
  );
}
