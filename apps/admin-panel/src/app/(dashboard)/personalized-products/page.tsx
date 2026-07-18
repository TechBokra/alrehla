'use client';

import PageComponent from '@/page-views/admin/AdminPersonalizedProductsPage';
import PermissionGate from '@/components/auth/PermissionGate';

export default function RoutePage() {
  return (
    <PermissionGate permission="canManageEnhaLakProducts">
      <PageComponent />
    </PermissionGate>
  );
}
