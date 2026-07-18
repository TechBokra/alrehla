"use client";


import React from 'react';
import { Navigate, useLocation } from '@/lib/router-compat';
import { useAuth } from '../../contexts/AuthContext';
import PageLoader from '@alrehla/ui/page-loader';
import { getAdminPanelUrl } from '../../lib/adminPanelUrl';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  studentOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false, studentOnly = false }) => {
  const { isLoggedIn, hasAdminAccess, currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader text="جاري التحقق من الصلاحيات..." />;
  }

  // 1. التحقق من تسجيل الدخول
  if (!isLoggedIn || !currentUser) {
    if (adminOnly) {
        return <Navigate to={getAdminPanelUrl('/login')} state={{ from: location }} replace />;
    }
    return <Navigate to="/account" state={{ from: location }} replace />;
  }
  
  // 2. حماية مسارات الإدارة
  if (adminOnly && !hasAdminAccess) {
    return <Navigate to="/account" replace />;
  }

  // 3. حماية مسارات الطالب (ومنع أولياء الأمور من دخولها بالخطأ)
  if (studentOnly) {
      if (currentUser.role !== 'student') {
          return <Navigate to="/account" replace />;
      }
  }

  // 4. السماح بالدخول
  return <>{children}</>;
};

export default ProtectedRoute;
