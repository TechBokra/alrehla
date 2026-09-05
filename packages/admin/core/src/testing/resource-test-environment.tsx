import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  AdminNavigationProvider,
  type AdminNavigationAdapter,
} from "../navigation";
import type { ResourceDefinition } from "../resource/contracts";
import { ResourceExecutionContextProvider } from "../resource/execution-context";
import { ResourceProvider } from "../resource/provider";
import type { ResourceExecutionContext } from "../resource/contracts/resource-query";
import {
  createResourceAuthorization,
  ResourceAuthorizationProvider,
  type ResourceAuthorization,
} from "../resource/authorization";

export interface ResourceNavigationFixture extends AdminNavigationAdapter {
  pathname: string;
  searchParams: URLSearchParams;
  router: AdminNavigationAdapter;
  pushes: string[];
  replaces: string[];
  backCalls: number;
  history: string[];
  subscribe(listener: () => void): () => void;
  reset: () => void;
}

export interface ResourceTestEnvironmentOptions {
  /** Undefined is intentional: Store-scoped resources must fail closed. */
  storeId?: string;
  /** Optional deterministic authorization fixture for mapped Resources. */
  authorization?: ResourceAuthorizationFixture;
  queryClient?: QueryClient;
  pathname?: string;
  searchParams?: URLSearchParams;
}

export interface ResourceAuthorizationFixture {
  authorized?: boolean;
  permissions?: readonly string[];
  status?: "loading" | "ready" | "error" | "unavailable";
}

export interface ResourceTestResourceProps {
  definition: ResourceDefinition<any, any, any, any, any, any, any>;
  initialData?: unknown;
  defaultDensity?: "compact" | "comfortable" | "spacious";
  children: React.ReactNode;
}

export interface ResourceTestEnvironment {
  queryClient: QueryClient;
  execution: ResourceExecutionContext | undefined;
  /** The fixture used to build the test-only Resource authorization adapter. */
  authorization: ResourceAuthorizationFixture | undefined;
  navigation: ResourceNavigationFixture;
  /** QueryClient + trusted execution context, without adding a Store implicitly. */
  wrapper: React.ComponentType<{ children: React.ReactNode }>;
  /** Full provider stack for runtime tests, including navigation. */
  Resource: React.ComponentType<ResourceTestResourceProps>;
}

function createNavigationFixture(
  pathname: string,
  searchParams: URLSearchParams
): ResourceNavigationFixture {
  const pushes: string[] = [];
  const replaces: string[] = [];
  const listeners = new Set<() => void>();
  let historyIndex = 0;
  const initialUrl = formatUrl(pathname, searchParams);
  const history = [initialUrl];
  const setLocation = (href: string) => {
    const parsed = new URL(href, "http://admin.test");
    fixture.pathname = parsed.pathname;
    for (const key of Array.from(fixture.searchParams.keys())) {
      fixture.searchParams.delete(key);
    }
    for (const [key, value] of parsed.searchParams.entries()) {
      fixture.searchParams.append(key, value);
    }
    listeners.forEach((listener) => listener());
  };
  const applyHref = (href: string, mode: "push" | "replace") => {
    const nextUrl = formatUrl(
      href,
      new URLSearchParams(new URL(href, "http://admin.test").search)
    );
    if (mode === "push") {
      history.splice(historyIndex + 1);
      history.push(nextUrl);
      historyIndex = history.length - 1;
    } else {
      history[historyIndex] = nextUrl;
    }
    setLocation(nextUrl);
  };
  const fixture: ResourceNavigationFixture = {
    pathname,
    searchParams,
    pushes,
    replaces,
    backCalls: 0,
    history,
    push: (href) => {
      pushes.push(href);
      applyHref(href, "push");
    },
    replace: (href) => {
      replaces.push(href);
      applyHref(href, "replace");
    },
    back: () => {
      fixture.backCalls += 1;
      if (historyIndex === 0) return;
      historyIndex -= 1;
      const previous = history[historyIndex];
      if (previous) setLocation(previous);
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    router: {
      push: (href, options) => fixture.push(href, options),
      replace: (href, options) => fixture.replace(href, options),
      back: () => fixture.back(),
    },
    reset: () => {
      pushes.length = 0;
      replaces.length = 0;
      fixture.backCalls = 0;
      history.splice(0, history.length, initialUrl);
      historyIndex = 0;
      setLocation(initialUrl);
    },
  };
  return fixture;
}

function formatUrl(pathname: string, searchParams: URLSearchParams) {
  const parsed = new URL(pathname, "http://admin.test");
  parsed.search = searchParams.toString();
  return `${parsed.pathname}${parsed.search}`;
}

function ResourceTestProviders({
  queryClient,
  execution,
  authorization,
  navigation,
  children,
}: {
  queryClient: QueryClient;
  execution: ResourceExecutionContext | undefined;
  authorization: ResourceAuthorization | undefined;
  navigation: ResourceNavigationFixture;
  children: React.ReactNode;
}) {
  const [revision, refresh] = React.useState(0);
  React.useEffect(() => {
    const listener = () => refresh((value) => value + 1);
    return navigation.subscribe(listener);
  }, [navigation]);
  const location = React.useMemo(
    () => ({
      pathname: navigation.pathname,
      searchParams: new URLSearchParams(navigation.searchParams.toString()),
    }),
    [navigation, navigation.pathname, navigation.searchParams, revision]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ResourceExecutionContextProvider
        {...(execution ? { value: execution } : {})}
      >
        <ResourceAuthorizationProvider
          {...(authorization ? { value: authorization } : {})}
        >
          <AdminNavigationProvider navigation={navigation} location={location}>
            {children}
          </AdminNavigationProvider>
        </ResourceAuthorizationProvider>
      </ResourceExecutionContextProvider>
    </QueryClientProvider>
  );
}

export function createResourceTestEnvironment(
  options: ResourceTestEnvironmentOptions = {}
): ResourceTestEnvironment {
  const queryClient =
    options.queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  const execution = options.storeId ? { storeId: options.storeId } : undefined;
  const authorization = options.authorization
    ? createResourceAuthorization({
        ...(options.storeId ? { storeId: options.storeId } : {}),
        ...(options.authorization.status
          ? { status: options.authorization.status }
          : {}),
        ...(options.authorization.permissions
          ? { permissions: options.authorization.permissions }
          : {}),
        ...(options.authorization.authorized !== undefined
          ? { authorized: options.authorization.authorized }
          : {}),
      })
    : undefined;
  const navigation = createNavigationFixture(
    options.pathname ?? "/resource",
    options.searchParams ?? new URLSearchParams()
  );

  function wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ResourceTestProviders
        queryClient={queryClient}
        execution={execution}
        authorization={authorization}
        navigation={navigation}
      >
        {children}
      </ResourceTestProviders>
    );
  }

  function Resource({
    definition,
    initialData,
    defaultDensity,
    children,
  }: ResourceTestResourceProps) {
    return (
      <ResourceTestProviders
        queryClient={queryClient}
        execution={execution}
        authorization={authorization}
        navigation={navigation}
      >
        <ResourceProvider
          definition={definition}
          {...(initialData !== undefined ? { initialData } : {})}
          {...(defaultDensity ? { defaultDensity } : {})}
        >
          {children}
        </ResourceProvider>
      </ResourceTestProviders>
    );
  }

  return {
    queryClient,
    execution,
    authorization: options.authorization,
    navigation,
    wrapper,
    Resource,
  };
}
