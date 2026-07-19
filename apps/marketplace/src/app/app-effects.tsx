'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initGA, pageview } from '@/lib/ga';

export default function AppEffects() {
  const pathname = usePathname() || '/';

  useEffect(() => {
    initGA();
  }, []);

  useEffect(() => {
    const query = typeof window === 'undefined' ? '' : window.location.search;
    pageview(pathname + query);
  }, [pathname]);

  return null;
}
