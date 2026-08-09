'use client';

import React from 'react';
import type { Permissions } from '@/lib/roles';

export default function PermissionGate({
  children,
}: {
  children: React.ReactNode;
  permission?: keyof Permissions;
}) {
  return <>{children}</>;
}
