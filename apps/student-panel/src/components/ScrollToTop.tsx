"use client";

import React, { useEffect } from 'react';
import { useLocation } from '@/lib/router-compat';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    try {
      // Use the modern API with an options object to ensure instant scrolling
      window.scroll({
        top: 0,
        left: 0,
        behavior: 'instant',
      });
    } catch (e) {
      // Fallback for older browsers that might not support the options object
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;