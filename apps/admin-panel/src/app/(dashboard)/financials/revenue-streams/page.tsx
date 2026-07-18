'use client';

import PageComponent from '@/page-views/admin/financials/RevenueStreamsPage';
import PermissionGate from '@/components/auth/PermissionGate';

export default function RoutePage() {
  return (
    <PermissionGate permission="canManageFinancials">
      <PageComponent />
    </PermissionGate>
  );
}
