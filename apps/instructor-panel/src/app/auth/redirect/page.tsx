'use client';

import React, { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageLoader from '@alrehla/ui/page-loader';

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = searchParams.get('next') || '/';
    router.replace(next);
  }, [router, searchParams]);

  return <PageLoader text="جاري الانتقال إلى لوحة التحكم..." />;
}

export default function AuthRedirectPage() {
  return (
    <Suspense fallback={<PageLoader text="جاري الانتقال..." />}>
      <RedirectContent />
    </Suspense>
  );
}
