'use client';

import React from 'react';
import AdminAccessGuard from './AdminAccessGuard';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  if (adminOnly) return <AdminAccessGuard>{children}</AdminAccessGuard>;
  return <>{children}</>;
};

export default ProtectedRoute;
