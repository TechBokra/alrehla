'use client';

import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSession } from '@clerk/nextjs';
import { AdminNavigationProvider } from '@alrehla/admin-core/navigation';
import { ToastProvider } from '@/contexts/ToastContext';
import {
  clearSupabaseAccessTokenProvider,
  setSupabaseAccessTokenProvider,
} from '@/lib/supabaseClient';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

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

function InstructorNavigationAdapter({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const navigation = React.useMemo(
    () => ({
      push: (url: string, options?: { scroll?: boolean }) => router.push(url, options),
      replace: (url: string, options?: { scroll?: boolean }) => router.replace(url, options),
      back: () => router.back(),
    }),
    [router],
  );
  const location = React.useMemo(
    () => ({ pathname, searchParams: new URLSearchParams(searchParams.toString()) }),
    [pathname, searchParams],
  );

  return (
    <AdminNavigationProvider navigation={navigation} location={location}>
      {children}
    </AdminNavigationProvider>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <React.Suspense fallback={null}>
        <InstructorNavigationAdapter>
          <ToastProvider>
            <SupabaseClerkSync />
            {children}
          </ToastProvider>
        </InstructorNavigationAdapter>
      </React.Suspense>
    </QueryClientProvider>
  );
}
