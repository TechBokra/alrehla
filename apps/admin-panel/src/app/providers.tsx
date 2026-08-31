'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminNavigationProvider } from '@alrehla/admin-core/navigation';
import {
  createResourceAuthorization,
  ResourceAuthorizationProvider,
} from '@alrehla/admin-core/resource';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ProductProvider } from '@/contexts/ProductContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

function AdminResourceAuthorizationBridge({ children }: { children: React.ReactNode }) {
  const { permissions, authStatus } = useAuth();
  const authorization = React.useMemo(() => createResourceAuthorization({
    status: authStatus === 'authenticated'
      ? 'ready'
      : authStatus === 'loading'
        ? 'loading'
        : 'error',
    permissions: Object.entries(permissions)
      .filter(([, allowed]) => allowed)
      .map(([permission]) => permission),
  }), [authStatus, permissions]);

  return (
    <ResourceAuthorizationProvider value={authorization}>
      {children}
    </ResourceAuthorizationProvider>
  );
}

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

function AdminNavigationAdapter({ children }: { children: React.ReactNode }) {
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
      <ToastProvider>
        <AuthProvider>
          <AdminResourceAuthorizationBridge>
            <ProductProvider>{children}</ProductProvider>
          </AdminResourceAuthorizationBridge>
        </AuthProvider>
      </ToastProvider>
    </AdminNavigationProvider>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <React.Suspense fallback={null}>
        <AdminNavigationAdapter>{children}</AdminNavigationAdapter>
      </React.Suspense>
    </QueryClientProvider>
  );
}
