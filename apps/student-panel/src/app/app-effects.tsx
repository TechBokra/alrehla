'use client';

import { useEffect } from 'react';
import { supabaseAuthClient } from '@/lib/supabaseClient';
import { redirectToMarketplace } from '@/lib/marketplaceUrl';

export default function StudentAppEffects() {
  useEffect(() => {
    const handleAuthStateChange = async (event: string) => {
      if (event === 'PASSWORD_RECOVERY') {
        redirectToMarketplace('/reset-password');
      }
    };

    const {
      data: { subscription },
    } = supabaseAuthClient.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return null;
}
