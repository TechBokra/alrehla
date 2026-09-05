import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  createDataViewState,
  createResourceAuthorization,
  createResourceCacheTools,
  defineResource,
  ResourceExecutionContextProvider,
  ResourceAuthorizationProvider,
  scopeResourceKey,
  useResourceMutations,
  useResourceQuery,
  type ResourceQueryContext,
} from "../src";
import { createResourceTestEnvironment } from "../src/testing";

type Row = { id: string; name: string };

function createWrapper(
  queryClient: QueryClient,
  storeId?: string
): React.ComponentType<{ children: React.ReactNode }> {
  return function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        {storeId ? (
          <ResourceExecutionContextProvider value={{ storeId }}>
            {children}
          </ResourceExecutionContextProvider>
        ) : (
          children
        )}
      </QueryClientProvider>
    );
  };
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

const state = createDataViewState();

describe("Resource scope", () => {
  it("binds Table initial data when authorization becomes ready", async () => {
    const queryFn = vi.fn(async () => ({
      rows: [{ id: "fetched", name: "Fetched" }],
      count: 1,
    }));
    const resource = defineResource<Row>({
      scope: "global",
      metadata: {
        name: "authorized-widgets",
        label: "Authorized Widgets",
        singularLabel: "Authorized Widget",
      },
      authorization: { read: "widgets.read" },
      query: {
        queryKey: () => ["authorized-widgets"],
        queryFn,
        normalize: (response) => response,
      },
      dataView: { columns: [], getRowId: (row) => row.id },
    });
    const queryClient = createQueryClient();
    let makeReady: (() => void) | undefined;
    const wrapper = ({ children }: { children: React.ReactNode }) => {
      const [status, setStatus] = React.useState<"loading" | "ready">(
        "loading"
      );
      makeReady = () => setStatus("ready");
      const authorization = React.useMemo(
        () => createResourceAuthorization({ status, authorized: true }),
        [status]
      );
      return (
        <QueryClientProvider client={queryClient}>
          <ResourceAuthorizationProvider value={authorization}>
            {children}
          </ResourceAuthorizationProvider>
        </QueryClientProvider>
      );
    };
    const initialData = {
      rows: [{ id: "initial", name: "Initial" }],
      count: 1,
    };
    const query = renderHook(
      () => useResourceQuery(resource, initialData, createDataViewState()),
      { wrapper }
    );

    expect(query.result.current.data).toBeUndefined();
    act(() => makeReady?.());
    await waitFor(() =>
      expect(query.result.current.data?.rows).toEqual(initialData.rows)
    );
    await waitFor(() => expect(queryFn).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(query.result.current.data?.rows).toEqual([
        { id: "fetched", name: "Fetched" },
      ])
    );
  });

  it("uses the authorized effective view before querying and fails closed with none", async () => {
    const queryKey = vi.fn(({ view }: ResourceQueryContext) => ["view-aware-widgets", view?.id]);
    const queryFn = vi.fn(async (context: ResourceQueryContext) => ({
      rows: [{ id: context.view?.id ?? "missing", name: "resolved" }],
      count: 1,
    }));
    const resource = defineResource<Row>({
      scope: "store",
      metadata: {
        name: "view-aware-widgets",
        label: "View-aware Widgets",
        singularLabel: "View-aware Widget",
      },
      authorization: { read: "widgets.read" },
      views: [
        { id: "grid", type: "grid", permission: "widgets.grid" },
        { id: "table", type: "table", default: true },
      ],
      query: {
        queryKey,
        queryFn,
        normalize: (response) => response,
      },
      dataView: { columns: [], getRowId: (row) => row.id },
    });
    const allowed = createResourceTestEnvironment({
      storeId: "store_a",
      authorization: { permissions: ["widgets.read"] },
    });
    const allowedQuery = renderHook(
      () =>
        useResourceQuery(
          resource,
          undefined,
          createDataViewState({ activeView: "grid" })
        ),
      { wrapper: allowed.wrapper }
    );

    await waitFor(() => expect(queryFn).toHaveBeenCalledOnce());
    expect(queryFn).toHaveBeenCalledWith(
      expect.objectContaining({
        state: expect.objectContaining({ activeView: "grid" }),
        view: expect.objectContaining({
          id: "table",
          type: "table",
          config: {},
        }),
      })
    );
    expect(queryKey).toHaveBeenCalledWith(expect.objectContaining({
      state: expect.objectContaining({ activeView: "grid" }),
      view: expect.objectContaining({ id: "table" }),
    }));
    expect(allowed.queryClient.getQueryCache().getAll()[0]?.queryKey).toEqual([
      "store", "store_a", "view-aware-widgets", "table",
    ]);
    allowedQuery.unmount();
    queryKey.mockClear();

    const denied = createResourceTestEnvironment({
      storeId: "store_a",
      authorization: { permissions: [] },
    });
    const deniedQuery = renderHook(
      () => useResourceQuery(resource, undefined, createDataViewState()),
      { wrapper: denied.wrapper }
    );
    await waitFor(() => expect(deniedQuery.result.current.fetchStatus).toBe("idle"));
    expect(queryFn).toHaveBeenCalledOnce();
    expect(queryKey).not.toHaveBeenCalled();
    const refetched = await deniedQuery.result.current.refetch();
    expect(refetched.error?.message).toContain("no authorized active view");
    expect(queryFn).toHaveBeenCalledOnce();
    expect(queryKey).not.toHaveBeenCalled();
  });

  it("prefixes global queries without requiring Store context", async () => {
    const queryFn = vi.fn(async () => ({
      rows: [{ id: "1", name: "Global" }],
      count: 1,
    }));
    const resource = defineResource<Row>({
      scope: "global",
      metadata: {
        name: "global-widgets",
        label: "Widgets",
        singularLabel: "Widget",
        pluralLabel: "Widgets",
      },
      query: {
        queryKey: () => ["platform", "widgets"],
        queryFn,
        normalize: (response) => response,
      },
      dataView: { columns: [], getRowId: (row) => row.id },
    });
    const queryClient = createQueryClient();

    const { result } = renderHook(
      () => useResourceQuery(resource, undefined, state),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => expect(result.current.data?.rows).toHaveLength(1));
    expect(queryFn).toHaveBeenCalledOnce();
    expect(queryClient.getQueryCache().getAll()[0]?.queryKey).toEqual([
      "global",
      "platform",
      "widgets",
    ]);
  });

  it("executes global mutations and scopes their invalidations globally", async () => {
    const mutationFn = vi.fn(async () => ({ id: "1" }));
    const queryClient = createQueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const resource = defineResource<Row, { name: string }>({
      scope: "global",
      metadata: {
        name: "global-widgets",
        label: "Widgets",
        singularLabel: "Widget",
        pluralLabel: "Widgets",
      },
      dataView: { columns: [], getRowId: (row) => row.id },
      mutations: {
        create: {
          mutationKey: ["platform", "widgets", "create"],
          mutationFn,
          invalidateQueries: [["platform", "widgets"]],
        },
      },
    });

    const { result } = renderHook(() => useResourceMutations(resource), {
      wrapper: createWrapper(queryClient),
    });
    await result.current.createMutation.mutateAsync({ name: "Global" });

    expect(mutationFn).toHaveBeenCalledOnce();
    expect(
      queryClient.getMutationCache().getAll()[0]?.options.mutationKey
    ).toEqual(["global", "platform", "widgets", "create"]);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["global", "platform", "widgets"],
    });
  });

  it("scopes Store queries and mutations to Store A", async () => {
    const queryFn = vi.fn(async () => ({
      rows: [{ id: "1", name: "Store A" }],
      count: 1,
    }));
    const mutationFn = vi.fn(async () => ({ id: "1" }));
    const resource = defineResource<Row, { name: string }>({
      scope: "store",
      metadata: {
        name: "store-widgets",
        label: "Widgets",
        singularLabel: "Widget",
        pluralLabel: "Widgets",
      },
      query: {
        queryKey: () => ["catalog", "widgets"],
        queryFn,
        normalize: (response) => response,
      },
      dataView: { columns: [], getRowId: (row) => row.id },
      mutations: {
        create: {
          mutationKey: ["catalog", "widgets", "create"],
          mutationFn,
          invalidateQueries: [["catalog", "widgets"]],
        },
      },
    });
    const queryClient = createQueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

    const query = renderHook(
      () => useResourceQuery(resource, undefined, state),
      { wrapper: createWrapper(queryClient, "store_a") }
    );
    await waitFor(() =>
      expect(query.result.current.data?.rows).toHaveLength(1)
    );

    const mutation = renderHook(() => useResourceMutations(resource), {
      wrapper: createWrapper(queryClient, "store_a"),
    });
    await mutation.result.current.createMutation.mutateAsync({
      name: "Store A",
    });

    expect(
      queryClient
        .getQueryCache()
        .getAll()
        .map((entry) => entry.queryKey)
    ).toContainEqual(["store", "store_a", "catalog", "widgets"]);
    expect(
      queryClient.getMutationCache().getAll()[0]?.options.mutationKey
    ).toEqual(["store", "store_a", "catalog", "widgets", "create"]);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["store", "store_a", "catalog", "widgets"],
    });
    expect(
      scopeResourceKey("store", ["catalog", "widgets"], "store_b")
    ).not.toEqual(scopeResourceKey("store", ["catalog", "widgets"], "store_a"));
    const missingStoreKey = scopeResourceKey("store", ["catalog", "widgets"]);
    expect(scopeResourceKey("store", missingStoreKey)).toEqual(missingStoreKey);
  });

  it("prevents a Store cache facade from reaching global keys", async () => {
    const queryClient = createQueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const globalKey = ["global", "platform", "widgets"];
    queryClient.setQueryData(globalKey, { source: "global" });
    const storeCache = createResourceCacheTools({
      client: queryClient,
      scope: "store",
      storeId: "store_a",
    });

    storeCache.setQueryData(globalKey, { source: "store" });
    await storeCache.invalidate(globalKey);

    expect(queryClient.getQueryData(globalKey)).toEqual({ source: "global" });
    expect(
      queryClient.getQueryData(["store", "store_a", ...globalKey])
    ).toEqual({ source: "store" });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["store", "store_a", ...globalKey],
    });
  });

  it("supports canonical cache aliases and removes only the bound Store", () => {
    const queryClient = createQueryClient();
    const relativeKey = ["catalog", "widgets"];
    const storeA = createResourceCacheTools({
      client: queryClient,
      scope: "store",
      storeId: "store_a",
    });
    const storeB = createResourceCacheTools({
      client: queryClient,
      scope: "store",
      storeId: "store_b",
    });

    storeA.set(relativeKey, { source: "a" });
    storeB.set(relativeKey, { source: "b" });
    expect(storeA.get(relativeKey)).toEqual({ source: "a" });
    expect(storeB.get(relativeKey)).toEqual({ source: "b" });

    storeA.remove(relativeKey);
    expect(storeA.get(relativeKey)).toBeUndefined();
    expect(storeB.get(relativeKey)).toEqual({ source: "b" });
  });

  it("scopes dynamic and bulk mutation invalidations", async () => {
    const queryClient = createQueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const resource = defineResource<Row, { name: string }, string[]>({
      scope: "store",
      metadata: {
        name: "store-widgets",
        label: "Widgets",
        singularLabel: "Widget",
      },
      dataView: { columns: [], getRowId: (row) => row.id },
      mutations: {
        create: {
          mutationFn: async (input) => ({ id: input.name }),
          invalidateQueries: async () => [["catalog", "widgets"]],
        },
        deleteMany: {
          mutationFn: async (ids) => ids,
          getInput: (rows) => rows.map((row) => row.id),
          invalidateQueries: [
            ["catalog", "widgets"],
            ["catalog", "widget-details"],
          ],
        },
      },
    });
    const mutation = renderHook(() => useResourceMutations(resource), {
      wrapper: createWrapper(queryClient, "store_a"),
    });

    await mutation.result.current.createMutation.mutateAsync({ name: "new" });
    await mutation.result.current.deleteManyMutation.mutateAsync(["widget_1"]);

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["store", "store_a", "catalog", "widgets"],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["store", "store_a", "catalog", "widget-details"],
    });
    expect(
      invalidateQueries.mock.calls.every(
        ([call]) =>
          (call as { queryKey?: unknown[] }).queryKey?.[1] !== "store_b"
      )
    ).toBe(true);
  });

  it("keeps a late Store A response out of Store B after switching context", async () => {
    const queryClient = createQueryClient();
    const deferred = new Map<
      string,
      (response: { rows: Row[]; count: number }) => void
    >();
    const queryFn = vi.fn(({ execution }: ResourceQueryContext) => {
      return new Promise<{ rows: Row[]; count: number }>((resolve) => {
        deferred.set(execution?.storeId ?? "missing", resolve);
      });
    });
    const resource = defineResource<
      Row,
      never,
      never,
      { rows: Row[]; count: number }
    >({
      scope: "store",
      metadata: {
        name: "switchable-widgets",
        label: "Widgets",
        singularLabel: "Widget",
      },
      query: {
        queryKey: () => ["catalog", "widgets"],
        queryFn,
        normalize: (response) => response,
      },
      dataView: { columns: [], getRowId: (row) => row.id },
    });
    let switchStore: ((storeId: string) => void) | undefined;
    function SwitchingWrapper({ children }: { children: React.ReactNode }) {
      const [storeId, setStoreId] = React.useState("store_a");
      switchStore = setStoreId;
      return (
        <QueryClientProvider client={queryClient}>
          <ResourceExecutionContextProvider value={{ storeId }}>
            {children}
          </ResourceExecutionContextProvider>
        </QueryClientProvider>
      );
    }

    const hook = renderHook(
      () =>
        useResourceQuery(
          resource,
          { rows: [{ id: "initial", name: "Store A initial" }], count: 1 },
          state
        ),
      { wrapper: SwitchingWrapper }
    );
    await waitFor(() =>
      expect(queryFn).toHaveBeenCalledWith(
        expect.objectContaining({ execution: { storeId: "store_a" } })
      )
    );

    act(() => switchStore?.("store_b"));
    await waitFor(() =>
      expect(queryFn).toHaveBeenCalledWith(
        expect.objectContaining({ execution: { storeId: "store_b" } })
      )
    );
    expect(hook.result.current.data).toBeUndefined();

    await act(async () => {
      deferred.get("store_a")?.({
        rows: [{ id: "a", name: "Store A" }],
        count: 1,
      });
      await Promise.resolve();
    });
    expect(
      queryClient.getQueryData(
        scopeResourceKey("store", ["catalog", "widgets"], "store_b")
      )
    ).toBeUndefined();
    expect(hook.result.current.data).toBeUndefined();

    act(() => {
      deferred.get("store_b")?.({
        rows: [{ id: "b", name: "Store B" }],
        count: 1,
      });
    });
    await waitFor(() =>
      expect(hook.result.current.data?.rows[0]?.name).toBe("Store B")
    );
    hook.unmount();
  });

  it("keeps a late old query-state response out of the current Resource state", async () => {
    const queryClient = createQueryClient();
    const deferred = new Map<
      string,
      (response: { rows: Row[]; count: number }) => void
    >();
    const queryFn = vi.fn(({ state: queryState }: ResourceQueryContext) => {
      return new Promise<{ rows: Row[]; count: number }>((resolve) => {
        deferred.set(queryState.search, resolve);
      });
    });
    const resource = defineResource<
      Row,
      never,
      never,
      { rows: Row[]; count: number }
    >({
      scope: "store",
      metadata: {
        name: "searchable-widgets",
        label: "Widgets",
        singularLabel: "Widget",
      },
      query: {
        queryKey: ({ state: queryState }) => [
          "catalog",
          "widgets",
          queryState.search,
        ],
        queryFn,
        normalize: (response) => response,
      },
      dataView: { columns: [], getRowId: (row) => row.id },
    });

    const hook = renderHook(
      ({
        queryState,
      }: {
        queryState: ReturnType<typeof createDataViewState>;
      }) => useResourceQuery(resource, undefined, queryState),
      {
        initialProps: { queryState: createDataViewState({ search: "sho" }) },
        wrapper: createWrapper(queryClient, "store_a"),
      }
    );
    await waitFor(() => expect(queryFn).toHaveBeenCalledTimes(1));

    hook.rerender({ queryState: createDataViewState({ search: "shirt" }) });
    await waitFor(() => expect(queryFn).toHaveBeenCalledTimes(2));

    await act(async () => {
      deferred.get("sho")?.({ rows: [{ id: "old", name: "Old" }], count: 1 });
      await Promise.resolve();
    });
    expect(hook.result.current.data).toBeUndefined();

    act(() => {
      deferred.get("shirt")?.({
        rows: [{ id: "new", name: "Shirt" }],
        count: 1,
      });
    });
    await waitFor(() =>
      expect(hook.result.current.data?.rows[0]?.name).toBe("Shirt")
    );
    hook.unmount();
  });

  it("binds a late Store A mutation cache update to Store A", async () => {
    const queryClient = createQueryClient();
    let resolveCreate: ((result: Row) => void) | undefined;
    const resource = defineResource<Row, { name: string }>({
      scope: "store",
      metadata: {
        name: "switchable-widgets",
        label: "Widgets",
        singularLabel: "Widget",
      },
      dataView: { columns: [], getRowId: (row) => row.id },
      mutations: {
        create: {
          mutationFn: () =>
            new Promise<Row>((resolve) => {
              resolveCreate = resolve;
            }),
          updateCache: ({ cache, result }) => {
            cache.setListData({ rows: [result as Row], count: 1 }, [
              "catalog",
              "widgets",
            ]);
          },
        },
      },
    });
    let activeStore: string | undefined;
    let switchStore: ((storeId: string) => void) | undefined;
    function SwitchingWrapper({ children }: { children: React.ReactNode }) {
      const [storeId, setStoreId] = React.useState("store_a");
      activeStore = storeId;
      switchStore = setStoreId;
      return (
        <QueryClientProvider client={queryClient}>
          <ResourceExecutionContextProvider value={{ storeId }}>
            {children}
          </ResourceExecutionContextProvider>
        </QueryClientProvider>
      );
    }

    const hook = renderHook(() => useResourceMutations(resource), {
      wrapper: SwitchingWrapper,
    });
    act(() => hook.result.current.createMutation.mutate({ name: "A" }));
    await waitFor(() =>
      expect(hook.result.current.createMutation.isPending).toBe(true)
    );
    act(() => switchStore?.("store_b"));
    await waitFor(() => expect(activeStore).toBe("store_b"));

    act(() => resolveCreate?.({ id: "a", name: "A" }));
    await waitFor(() =>
      expect(
        queryClient.getQueryData(
          scopeResourceKey("store", ["catalog", "widgets"], "store_a")
        )
      ).toEqual({ rows: [{ id: "a", name: "A" }], count: 1 })
    );
    expect(
      queryClient.getQueryData(
        scopeResourceKey("store", ["catalog", "widgets"], "store_b")
      )
    ).toBeUndefined();
    expect(
      queryClient.getQueryData(
        scopeResourceKey("store", ["catalog", "widgets"], "store_a")
      )
    ).toEqual({ rows: [{ id: "a", name: "A" }], count: 1 });
    hook.unmount();
  });

  it("keeps the legacy raw cache writer available under its migration alias", async () => {
    const queryClient = createQueryClient();
    const legacyUpdateCache = vi.fn();
    const resource = defineResource<Row, { name: string }>({
      scope: "store",
      metadata: {
        name: "store-widgets",
        label: "Widgets",
        singularLabel: "Widget",
      },
      dataView: { columns: [], getRowId: (row) => row.id },
      mutations: {
        create: {
          mutationFn: async (input) => ({ id: input.name }),
          // Compatibility regression: this fixture represents an intentional
          // legacy consumer until its raw cache writer can be migrated.
          legacyUpdateCache,
        },
      },
    });
    const mutation = renderHook(() => useResourceMutations(resource), {
      wrapper: createWrapper(queryClient, "store_a"),
    });

    await mutation.result.current.createMutation.mutateAsync({ name: "new" });
    expect(legacyUpdateCache).toHaveBeenCalledWith(
      { id: "new" },
      { name: "new" },
      queryClient
    );
  });

  it("fails closed for a Store resource without trusted Store context", async () => {
    const queryKey = vi.fn(() => ["catalog", "widgets"]);
    const queryFn = vi.fn(async () => ({ rows: [], count: 0 }));
    const mutationFn = vi.fn(async () => ({ id: "1" }));
    const resource = defineResource<Row, { name: string }>({
      metadata: {
        name: "store-widgets",
        label: "Widgets",
        singularLabel: "Widget",
        pluralLabel: "Widgets",
      },
      query: {
        queryKey,
        queryFn,
        normalize: (response) => response,
      },
      dataView: { columns: [], getRowId: (row) => row.id },
      mutations: { create: { mutationFn } },
    });
    const queryClient = createQueryClient();
    const query = renderHook(
      () => useResourceQuery(resource, undefined, state),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => expect(query.result.current.fetchStatus).toBe("idle"));
    expect(queryFn).not.toHaveBeenCalled();
    expect(queryKey).not.toHaveBeenCalled();
    expect(queryClient.getQueryCache().getAll()[0]?.queryKey).toEqual([
      "resource",
      "store-context-required",
      "resource",
      "store-widgets",
      "disabled",
    ]);
    const refetched = await query.result.current.refetch();
    expect(refetched.error?.message).toContain("requires a Store context");
    expect(queryKey).not.toHaveBeenCalled();
    expect(queryFn).not.toHaveBeenCalled();

    const mutation = renderHook(() => useResourceMutations(resource), {
      wrapper: createWrapper(queryClient),
    });
    await expect(
      mutation.result.current.createMutation.mutateAsync({ name: "Unsafe" })
    ).rejects.toMatchObject({
      code: "STORE_CONTEXT_REQUIRED",
    });
    expect(mutationFn).not.toHaveBeenCalled();
  });
});
