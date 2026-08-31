'use client';

import PageComponent from '@/features/users';
import PermissionGate from '@/components/auth/PermissionGate';

export default function RoutePage() {
  return (
    <PermissionGate permission="canManageUsers">
      <PageComponent />
    </PermissionGate>
  );
}
