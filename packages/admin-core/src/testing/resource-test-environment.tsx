import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminNavigationProvider, type AdminNavigationAdapter } from '../navigation';
import { ResourceAuthorizationProvider, createResourceAuthorization, type ResourceAuthorization } from '../resource/authorization';
import { ResourceExecutionContextProvider } from '../resource/execution-context';
import { ResourceProvider } from '../resource/provider';
import type { ResourceDefinition } from '../resource/contracts';

export interface ResourceTestNavigation extends AdminNavigationAdapter {
  pathname: string;
  searchParams: URLSearchParams;
  pushes: string[];
  replaces: string[];
}

export interface ResourceTestEnvironmentOptions {
  scopeId?: string;
  authorization?: {
    permissions?: readonly string[];
    authorized?: boolean;
    status?: 'loading' | 'ready' | 'error' | 'unavailable';
  };
  pathname?: string;
  searchParams?: URLSearchParams;
  queryClient?: QueryClient;
}

export interface ResourceTestEnvironment {
  queryClient: QueryClient;
  execution: { scopeId: string } | undefined;
  navigation: ResourceTestNavigation;
  authorization: ResourceAuthorization | undefined;
  wrapper: React.ComponentType<{ children: React.ReactNode }>;
  Resource: <TData, TCreateInput = unknown, TUpdateInput = unknown>(props: {
    definition: ResourceDefinition<TData, TCreateInput, TUpdateInput>;
    children: React.ReactNode;
  }) => React.ReactElement;
}

function createNavigation(
  pathname: string,
  searchParams: URLSearchParams,
): ResourceTestNavigation {
  const pushes: string[] = [];
  const replaces: string[] = [];
  return {
    pathname,
    searchParams,
    pushes,
    replaces,
    push: (url) => pushes.push(url),
    replace: (url) => replaces.push(url),
    back: () => undefined,
  };
}

export function createResourceTestEnvironment(
  options: ResourceTestEnvironmentOptions = {},
): ResourceTestEnvironment {
  const queryClient = options.queryClient ?? new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const execution = options.scopeId ? { scopeId: options.scopeId } : undefined;
  const authorization = options.authorization
    ? createResourceAuthorization(options.authorization)
    : undefined;
  const navigation = createNavigation(
    options.pathname ?? '/resource',
    options.searchParams ?? new URLSearchParams(),
  );

  function Providers({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ResourceExecutionContextProvider value={execution}>
          <ResourceAuthorizationProvider value={authorization}>
            <AdminNavigationProvider
              navigation={navigation}
              location={navigation}
            >
              {children}
            </AdminNavigationProvider>
          </ResourceAuthorizationProvider>
        </ResourceExecutionContextProvider>
      </QueryClientProvider>
    );
  }

  function Resource<TData, TCreateInput = unknown, TUpdateInput = unknown>({
    definition,
    children,
  }: {
    definition: ResourceDefinition<TData, TCreateInput, TUpdateInput>;
    children: React.ReactNode;
  }) {
    return (
      <Providers>
        <ResourceProvider definition={definition}>{children}</ResourceProvider>
      </Providers>
    );
  }

  return { queryClient, execution, navigation, authorization, wrapper: Providers, Resource };
}
