'use client';

import React, { Suspense } from 'react';
import { ClerkOAuthCallback } from '@alrehla/ui/auth';

export default function SSOCallbackPage() {
  return (
    <Suspense fallback={null}>
      <ClerkOAuthCallback defaultRedirectUrl="/dashboard" />
    </Suspense>
  );
}
