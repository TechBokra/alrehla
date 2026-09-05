import * as React from "react";
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import {
  createDataViewState,
  getDataViewTableState,
  defineResource,
  normalizeResourceList,
  ResourceProvider,
  useResource,
  useResourceMutations,
  useResourceQuery,
  type ResourceDefinition,
} from "../src";
import {
  createResourceTestEnvironment,
  defineResourceContractSuite,
} from "../src/testing";

type Row = { id: string; name: string; parentId: string | null; rank: number };
type Values = { name: string };
type Raw = { items: Row[]; total: number };

const row: Row = { id: "widget_1", name: "Widget", parentId: null, rank: 0 };
const queryResponse: Raw = { items: [row], total: 1 };

const queryFn = vi.fn(async () => queryResponse);
const createFn = vi.fn(async (values: Values) => ({
  id: "widget_2",
  ...values,
}));
const updateFn = vi.fn(
  async ({ record, values }: { record: Row; values: Values }) => ({
    ...record,
    ...values,
  })
);
const deleteFn = vi.fn(async (id: string) => id);

const resource = defineResource<Row, Values, Values, Raw>({
  scope: "store",
  metadata: {
    name: "widgets",
    label: "Widgets",
    singularLabel: "Widget",
    pluralLabel: "Widgets",
  },
  authorization: {
    read: "catalog.widgets.read",
    create: "catalog.widgets.create",
    update: "catalog.widgets.update",
    delete: "catalog.widgets.delete",
    export: "catalog.widgets.read",
    bulkActions: "catalog.widgets.delete",
  },
  query: {
    queryKey: ({ state }) => [
      "widgets",
      getDataViewTableState(state).pagination.pageIndex,
      state.search,
    ],
    queryFn,
    normalize: (response) =>
      normalizeResourceList(response.items, response.total),
  },
  mutations: {
    create: {
      mutationFn: createFn,
      mutationKey: ["widgets", "create"],
      invalidateQueries: [["widgets", "list"]],
      updateCache: ({ cache, result, input: _input }) => {
        cache.setListData({ rows: [result as Row], count: 1 });
      },
    },
    update: {
      mutationFn: updateFn,
      getInput: ({ record, values }) => ({ record, values }),
      mutationKey: ["widgets", "update"],
      invalidateQueries: [["widgets", "list"]],
    },
    delete: {
      mutationFn: deleteFn,
      getInput: (record) => record.id,
      mutationKey: ["widgets", "delete"],
      invalidateQueries: [["widgets", "list"]],
    },
    deleteMany: {
      mutationFn: async (ids: string[]) => ids,
      getInput: (records) => records.map((record) => record.id),
      getInputFromIds: (ids) => ids,
      invalidateQueries: [["widgets", "list"]],
    },
    reorder: {
      mutationFn: async (input) => input,
      invalidateQueries: [["widgets", "list"]],
    },
    import: {
      mutationFn: async (file) => file,
    },
  },
  dataView: {
    columns: [{ accessorKey: "name", header: "Name" }],
    getRowId: (value) => value.id,
    getRowHref: (value) => `/widgets/${value.id}`,
    search: { enabled: true },
    selection: { enabled: true, mode: "multiple", preserveAcrossPages: true },
    filters: [{ id: "name", label: "Name", type: "text" }],
    hierarchy: {
      enabled: true,
      getRowId: (value) => value.id,
      getParentId: (value) => value.parentId,
      getOrder: (value) => value.rank,
    },
    reorder: {
      getPayload: ({ updatedItem }) => ({
        id: String(updatedItem.id),
        parentId:
          updatedItem.parentId === null ? null : String(updatedItem.parentId),
        rank: updatedItem.index,
      }),
    },
    exportConfig: {
      filename: "widgets",
      modes: ["current-page", "selected", "filtered", "all"],
      columns: [{ key: "name", label: "Name", value: (value) => value.name }],
    },
  },
  export: {
    filename: "widgets",
    modes: ["current-page", "selected", "filtered", "all"],
    columns: [{ key: "name", label: "Name", value: (value) => value.name }],
  },
  import: {
    config: { expectedColumns: ["name"] },
  },
  forms: {
    create: {
      schema: () => undefined,
      fields: [{ field: "Input", name: "name" }],
      defaultValues: { name: "" },
    },
    update: {
      schema: () => undefined,
      fields: [{ field: "Input", name: "name" }],
      getDefaultValues: ({ record }: { record?: Row }) => ({
        name: record?.name ?? "",
      }),
    },
  },
});

defineResourceContractSuite({
  definition: resource,
  fixtures: {
    storeA: "store_a",
    storeB: "store_b",
    state: createDataViewState({ search: "widget" }),
    query: { response: queryResponse },
    mutations: {
      createInput: { name: "Created" },
      update: { record: row, values: { name: "Updated" } },
      deleteInput: row.id,
      deleteManyInput: [row.id],
      reorderInput: { id: row.id, parentId: null, rank: 0 },
    },
    forms: { record: row },
    rows: [row],
  },
});

const globalResource = defineResource<Row>({
  scope: "global",
  metadata: {
    name: "global-widgets",
    label: "Global Widgets",
    singularLabel: "Global Widget",
  },
  query: {
    queryKey: () => ["global-widgets"],
    queryFn: async () => normalizeResourceList([row], 1),
    normalize: (response) => response,
  },
  dataView: { columns: [], getRowId: (value) => value.id },
});

defineResourceContractSuite({
  definition: globalResource,
  fixtures: { storeA: "store_a", storeB: "store_b" },
});

function RuntimeProbe() {
  const current = useResource<Row, Values, Values>();
  return (
    <>
      <output data-testid="resource-runtime-row">
        {current.dataView.data[0]?.name ?? "none"}
      </output>
      <button type="button" onClick={() => current.dataView.onRowClick?.(row)}>
        Open row
      </button>
    </>
  );
}

describe("Resource test environment", () => {
  it("installs trusted Store scope without supplying an implicit Store", async () => {
    const environment = createResourceTestEnvironment({
      storeId: "store_a",
      authorization: { authorized: true },
    });
    const hook = renderHook(
      () => useResourceQuery(resource, undefined, createDataViewState()),
      { wrapper: environment.wrapper }
    );

    await waitFor(() => expect(hook.result.current.data?.rows).toHaveLength(1));
    expect(queryFn).toHaveBeenCalled();
    expect(
      environment.queryClient.getQueryCache().getAll()[0]?.queryKey
    ).toEqual(["store", "store_a", "widgets", 0, ""]);

    const missing = createResourceTestEnvironment();
    const missingHook = renderHook(
      () => useResourceQuery(resource, undefined, createDataViewState()),
      { wrapper: missing.wrapper }
    );
    await waitFor(() =>
      expect(missingHook.result.current.fetchStatus).toBe("idle")
    );
    expect(missing.queryClient.getQueryCache().getAll()[0]?.queryKey).toEqual([
      "resource",
      "store-context-required",
      "resource",
      "widgets",
      "disabled",
    ]);
  });

  it("runs the Resource runtime and records deterministic navigation calls", async () => {
    const environment = createResourceTestEnvironment({
      storeId: "store_a",
      pathname: "/widgets",
      authorization: { authorized: true },
    });
    const Resource = environment.Resource;

    render(
      <Resource definition={resource}>
        <RuntimeProbe />
      </Resource>
    );
    await waitFor(() =>
      expect(
        document.querySelector("[data-testid=resource-runtime-row]")
          ?.textContent
      ).toBe("Widget")
    );
    fireEvent.click(screen.getByRole("button", { name: "Open row" }));
    expect(environment.navigation.pushes).toEqual(["/widgets/widget_1"]);
    act(() => environment.navigation.reset());

    act(() => environment.navigation.router.push("/widgets?page=2"));
    act(() => environment.navigation.router.replace("/widgets?page=1"));
    expect(environment.navigation.pushes).toEqual(["/widgets?page=2"]);
    expect(environment.navigation.replaces).toEqual(["/widgets?page=1"]);
  });

  it("scopes mutation keys and invalidations and preserves normalized failures", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const environment = createResourceTestEnvironment({
      storeId: "store_a",
      queryClient,
      authorization: { authorized: true },
    });
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    queryClient.setQueryData(["store", "store_b", "widgets", "list"], {
      rows: [row],
      count: 1,
    });
    const hook = renderHook(() => useResourceMutations(resource), {
      wrapper: environment.wrapper,
    });

    await hook.result.current.createMutation.mutateAsync({ name: "Created" });
    expect(createFn).toHaveBeenCalledWith(
      { name: "Created" },
      expect.objectContaining({ execution: { storeId: "store_a" } })
    );
    expect(
      queryClient.getMutationCache().getAll()[0]?.options.mutationKey
    ).toEqual(["store", "store_a", "widgets", "create"]);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["store", "store_a", "widgets", "list"],
    });
    expect(
      queryClient.getQueryData(["store", "store_a", "widgets", "list"])
    ).toEqual({
      rows: [expect.objectContaining({ id: "widget_2" })],
      count: 1,
    });
    expect(
      queryClient.getQueryData(["store", "store_b", "widgets", "list"])
    ).toEqual({ rows: [row], count: 1 });

    const missing = createResourceTestEnvironment();
    const missingHook = renderHook(() => useResourceMutations(resource), {
      wrapper: missing.wrapper,
    });
    await expect(
      missingHook.result.current.createMutation.mutateAsync({ name: "Unsafe" })
    ).rejects.toMatchObject({
      code: "STORE_CONTEXT_REQUIRED",
    });
  });

  it("fails closed for privileged mutations while permission state is missing or denied", async () => {
    const denied = createResourceTestEnvironment({
      storeId: "store_a",
      authorization: { permissions: ["catalog.widgets.read"] },
    });
    const hook = renderHook(() => useResourceMutations(resource), {
      wrapper: denied.wrapper,
    });

    await expect(
      hook.result.current.createMutation.mutateAsync({ name: "Denied" })
    ).rejects.toMatchObject({
      code: "STORE_PERMISSION_REQUIRED",
      type: "authorization",
    });
  });

  it("does not run cache writers when a mutation fails", async () => {
    const updateCache = vi.fn();
    const failing = defineResource<Row, Values>({
      scope: "store",
      metadata: {
        name: "failing-widgets",
        label: "Failing Widgets",
        singularLabel: "Failing Widget",
      },
      mutations: {
        create: {
          mutationFn: async () => {
            throw new Error("mutation failed");
          },
          updateCache,
        },
      },
      dataView: { columns: [], getRowId: (value) => value.id },
    });
    const environment = createResourceTestEnvironment({
      storeId: "store_a",
      queryClient: new QueryClient({
        defaultOptions: { mutations: { retry: false } },
      }),
      authorization: { authorized: true },
    });
    const hook = renderHook(() => useResourceMutations(failing), {
      wrapper: environment.wrapper,
    });

    await expect(
      hook.result.current.createMutation.mutateAsync({ name: "Failed" })
    ).rejects.toThrow("mutation failed");
    expect(updateCache).not.toHaveBeenCalled();
  });

  it("passes TanStack cancellation signals to Resource query adapters", async () => {
    let signal: AbortSignal | undefined;
    const queryFnWithSignal = vi.fn(
      ({ signal: requestSignal }: { signal?: AbortSignal }) => {
        signal = requestSignal;
        return new Promise<Raw>((_resolve, reject) => {
          requestSignal?.addEventListener("abort", () => {
            reject(
              new DOMException("The operation was aborted.", "AbortError")
            );
          });
        });
      }
    );
    const cancellable = defineResource<Row, never, never, Raw>({
      scope: "store",
      metadata: {
        name: "cancellable-widgets",
        label: "Cancellable Widgets",
        singularLabel: "Cancellable Widget",
      },
      query: {
        queryKey: () => ["cancellable-widgets"],
        queryFn: queryFnWithSignal,
        normalize: (response) =>
          normalizeResourceList(response.items, response.total),
      },
      dataView: { columns: [], getRowId: (value) => value.id },
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const environment = createResourceTestEnvironment({
      storeId: "store_a",
      queryClient,
    });
    const hook = renderHook(
      () => useResourceQuery(cancellable, undefined, createDataViewState()),
      { wrapper: environment.wrapper }
    );

    await waitFor(() => expect(queryFnWithSignal).toHaveBeenCalledOnce());
    expect(signal).toBeInstanceOf(AbortSignal);
    await queryClient.cancelQueries({
      queryKey: ["store", "store_a", "cancellable-widgets"],
    });
    expect(signal?.aborted).toBe(true);
    expect(hook.result.current.error).toBeNull();
    hook.unmount();
  });
});
