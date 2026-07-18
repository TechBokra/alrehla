'use client';

import PageComponent from '@/page-views/admin/AdminOrdersPage';
import PermissionGate from '@/components/auth/PermissionGate';

export default function RoutePage() {
  return (
    <PermissionGate permission="canManageEnhaLakOrders">
      <PageComponent />
    </PermissionGate>
  );
}
