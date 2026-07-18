'use client';

import React from 'react';
import PermissionGate from './PermissionGate';
import type { Permissions } from '@/lib/roles';

const PermissionBasedRoute: React.FC<{ children: React.ReactElement; permission: keyof Permissions }> = ({ children, permission }) => {
  return <PermissionGate permission={permission}>{children}</PermissionGate>;
};

export default PermissionBasedRoute;
