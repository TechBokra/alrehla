'use client';

import React, { Suspense } from 'react';
import AdminLoginPage from '@/page-views/admin/AdminLoginPage';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginPage />
    </Suspense>
  );
}
