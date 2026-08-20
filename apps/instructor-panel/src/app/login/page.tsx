'use client';

import React, { Suspense } from 'react';
import InstructorLoginPage from '@/page-views/instructor/InstructorLoginPage';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <InstructorLoginPage />
    </Suspense>
  );
}
