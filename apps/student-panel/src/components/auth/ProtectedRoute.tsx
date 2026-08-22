'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PageLoader from '@alrehla/ui/page-loader';
import { getAdminPanelUrl } from '../../lib/adminPanelUrl';
import { getInstructorPanelUrl } from '../../lib/instructorPanelUrl';
import { getMarketplaceUrl } from '../../lib/marketplaceUrl';
import { canAccessAdmin, canAccessInstructorPanel } from '../../lib/roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  studentOnly?: boolean;
}

const ExternalRedirect: React.FC<{ to: string; text?: string }> = ({
  to,
  text = 'جاري تحويلك...',
}) => {
  useEffect(() => {
    window.location.assign(to);
  }, [to]);

  return <PageLoader text={text} />;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  adminOnly = false,
  studentOnly = true,
}) => {
  const { isLoggedIn, hasAdminAccess, currentUser, loading } = useAuth();

  if (loading) {
    return <PageLoader text="جاري التحقق من الصلاحيات..." />;
  }

  if (!isLoggedIn || !currentUser) {
    if (adminOnly) {
      return <ExternalRedirect to={getAdminPanelUrl('/login')} />;
    }

    return <ExternalRedirect to={getMarketplaceUrl('/account')} />;
  }

  if (adminOnly && !hasAdminAccess) {
    return <ExternalRedirect to={getAdminPanelUrl('/login')} />;
  }

  if (currentUser.role !== 'student') {
    if (canAccessInstructorPanel(currentUser.role)) {
      return <ExternalRedirect to={getInstructorPanelUrl('/')} text="هذه اللوحة مخصصة للطلاب. جاري تحويلك إلى لوحة المدربين..." />;
    }
    if (canAccessAdmin(currentUser.role)) {
      return <ExternalRedirect to={getAdminPanelUrl('/')} text="هذه اللوحة مخصصة للطلاب. جاري تحويلك إلى لوحة التحكم..." />;
    }
    return <ExternalRedirect to={getMarketplaceUrl('/account')} text="هذه اللوحة مخصصة للطلاب فقط..." />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
