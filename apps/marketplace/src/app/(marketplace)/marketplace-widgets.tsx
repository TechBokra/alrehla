'use client';

import dynamic from 'next/dynamic';

const DevelopmentBanner = dynamic(() => import('@/components/shared/DevelopmentBanner'), { ssr: false });
const OfflineBanner = dynamic(() => import('@/components/shared/OfflineBanner'), { ssr: false });
const ScrollToTop = dynamic(() => import('@/components/ScrollToTop'), { ssr: false });
const WhatsAppButton = dynamic(() => import('@/components/WhatsAppButton'), { ssr: false });
const ScrollToTopButton = dynamic(() => import('@/components/ScrollToTopButton'), { ssr: false });

export function MarketplaceTopWidgets() {
  return (
    <>
      <DevelopmentBanner />
      <OfflineBanner />
      <ScrollToTop />
    </>
  );
}

export function MarketplaceFloatingWidgets() {
  return (
    <>
      <WhatsAppButton />
      <ScrollToTopButton />
    </>
  );
}
