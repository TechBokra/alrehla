'use client';

import PageComponent from '@/page-views/admin/AdminBookingDetailPage';
import PermissionGate from '@/components/auth/PermissionGate';

export default function RoutePage() {
  return (
    <PermissionGate permission="canManageCreativeWritingBookings">
      <PageComponent />
    </PermissionGate>
  );
}
