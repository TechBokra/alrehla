"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';
import WhatsAppButton from '@/components/WhatsAppButton';
import ScrollToTopButton from '@/components/ScrollToTopButton';
import OfflineBanner from '@/components/shared/OfflineBanner';
import DevelopmentBanner from '@/components/shared/DevelopmentBanner';

import ProfileCompletionGuard from '@/components/auth/ProfileCompletionGuard';
import { supabase } from '@/lib/supabaseClient';
import { initGA, pageview } from '@/lib/ga';

export default function MarketplaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const showLayout = !pathname.startsWith('/session');

  useEffect(() => {
    const handleAuthStateChange = async (event: string) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.push('/reset-password');
      }
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    return () => { subscription?.unsubscribe(); };
  }, [router]);

  useEffect(() => { initGA(); }, []);

  useEffect(() => {
    const query = typeof window === 'undefined' ? '' : window.location.search;
    pageview(`${pathname}${query}`);
  }, [pathname]);

  return (
    <div className="flex flex-col min-h-screen" dir="rtl">
      <DevelopmentBanner />
      <OfflineBanner />
      {showLayout && <Header />}
      <ScrollToTop />
      <main className="flex-grow">
        <ProfileCompletionGuard>{children}</ProfileCompletionGuard>
      </main>
      {showLayout && <Footer />}
      {showLayout && (
        <>
          <WhatsAppButton />
          <ScrollToTopButton />
        </>
      )}
    </div>
  );
}
