'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { initGA, pageview } from '@/lib/ga';

export default function AppEffects() {
  const pathname = usePathname() || '/';
  const router = useRouter();

  useEffect(() => {
    const handleAuthStateChange = async (event: string) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.push('/reset-password');
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      subscription?.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    initGA();
  }, []);

  useEffect(() => {
    const query = typeof window === 'undefined' ? '' : window.location.search;
    pageview(pathname + query);
  }, [pathname]);

  return null;
}
