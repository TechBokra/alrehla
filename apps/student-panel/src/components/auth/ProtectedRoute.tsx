'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PageLoader from '@alrehla/ui/page-loader';
import { getAdminPanelUrl } from '../../lib/adminPanelUrl';
import { getMarketplaceUrl } from '../../lib/marketplaceUrl';

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
    return <ExternalRedirect to={getMarketplaceUrl('/account')} text="هذه اللوحة مخصصة للطلاب فقط..." />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
