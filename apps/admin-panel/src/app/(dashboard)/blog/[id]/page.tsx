'use client';

import PageComponent from '@/page-views/admin/AdminBlogPostEditorPage';
import PermissionGate from '@/components/auth/PermissionGate';

export default function RoutePage() {
  return (
    <PermissionGate permission="canManageBlog">
      <PageComponent />
    </PermissionGate>
  );
}
