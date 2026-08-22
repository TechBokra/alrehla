'use client';

import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSession } from '@clerk/nextjs';
import { ToastProvider } from '@/contexts/ToastContext';
import {
  clearSupabaseAccessTokenProvider,
  setSupabaseAccessTokenProvider,
} from '@/lib/supabaseClient';

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: 1,
        staleTime: 1000 * 60 * 10,
        gcTime: 1000 * 60 * 60,
      },
    },
  });

function SupabaseClerkSync() {
  const { session } = useSession();

  useEffect(() => {
    if (session) {
      setSupabaseAccessTokenProvider(async () => {
        try {
          return (await session.getToken()) || null;
        } catch {
          return null;
        }
      });
    } else {
      clearSupabaseAccessTokenProvider();
    }

    return () => {
      clearSupabaseAccessTokenProvider();
    };
  }, [session]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <SupabaseClerkSync />
        {children}
      </ToastProvider>
    </QueryClientProvider>
  );
}
