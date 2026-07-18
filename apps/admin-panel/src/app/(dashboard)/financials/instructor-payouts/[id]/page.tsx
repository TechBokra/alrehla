'use client';

import PageComponent from '@/page-views/admin/financials/InstructorFinancialDetailsPage';
import PermissionGate from '@/components/auth/PermissionGate';

export default function RoutePage() {
  return (
    <PermissionGate permission="canManageFinancials">
      <PageComponent />
    </PermissionGate>
  );
}
