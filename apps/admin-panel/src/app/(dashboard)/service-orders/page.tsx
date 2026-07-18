'use client';

import PageComponent from '@/page-views/admin/AdminServiceOrdersPage';
import PermissionGate from '@/components/auth/PermissionGate';

export default function RoutePage() {
  return (
    <PermissionGate permission="canManageCreativeWritingBookings">
      <PageComponent />
    </PermissionGate>
  );
}
