'use client';

import PageComponent from '@/page-views/admin/AdminProductDetailPage';
import PermissionGate from '@/components/auth/PermissionGate';

export default function RoutePage() {
  return (
    <PermissionGate permission="canManageOwnProducts">
      <PageComponent />
    </PermissionGate>
  );
}
