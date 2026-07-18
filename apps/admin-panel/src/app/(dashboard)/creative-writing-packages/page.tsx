'use client';

import PageComponent from '@/page-views/admin/AdminCreativeWritingPackagesPage';
import PermissionGate from '@/components/auth/PermissionGate';

export default function RoutePage() {
  return (
    <PermissionGate permission="canManageCreativeWritingSettings">
      <PageComponent />
    </PermissionGate>
  );
}
