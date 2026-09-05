import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ResourceProvider,
  ResourceExecutionContextProvider,
  defineResource,
  normalizeResourceList,
  useResource,
} from "@eng-mohamedelsayed/admin-core/resource";
import { getDataViewTableState } from "@eng-mohamedelsayed/admin-core/data-view";
import { ResourceDataView, ResourceExport } from "../src/components/resource";
import { TestNavigationProvider } from "./test-navigation-provider";

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn(), replace: vi.fn() },
  searchParams: {
    get: (_key: string) => null,
    entries: () => [][Symbol.iterator](),
  },
}));

type TestRecord = { id: string; name: string };
type TestValues = { name: string };
type TestListRaw = {
  items: TestRecord[];
  total: number;
  page: number;
  pageSize: number;
};

function createResourceRuntimeFixture() {
  const queryFn = vi.fn(async (): Promise<TestListRaw> => ({
    items: [{ id: "widget_2", name: "Fetched widget" }],
    total: 1,
    page: 1,
    pageSize: 10,
  }));
  const createFn = vi.fn(async (values: TestValues) => ({
    id: "widget_3",
    ...values,
  }));
  const reorderFn = vi.fn(
    async (input: { id: string; parentId: string | null; rank: number }) =>
      input
  );

  const resource = defineResource<
    TestRecord,
    TestValues,
    TestValues,
    TestListRaw
  >({
    metadata: {
      name: "widgets",
      label: "Widgets",
      singularLabel: "Widget",
    },
    capabilities: { create: true, export: true },
    query: {
      queryKey: ({ state }) => [
        "widgets",
        getDataViewTableState(state).pagination.pageIndex,
        state.search,
      ],
      queryFn,
      normalize: (response) =>
        normalizeResourceList(response.items, response.total, {
          page: response.page,
          pageSize: response.pageSize,
        }),
    },
    mutations: {
      create: {
        mutationFn: createFn,
      },
      reorder: {
        mutationFn: reorderFn,
      },
    },
    dataView: {
      columns: [{ accessorKey: "name", header: "Name" }],
      getRowId: (row) => row.id,
      reorder: {
        getPayload: ({ updatedItem }) => ({
          id: String(updatedItem.id),
          parentId:
            updatedItem.parentId === null ? null : String(updatedItem.parentId),
          rank: updatedItem.index,
        }),
      },
      urlState: { defaults: { page: 1, pageSize: 10 } },
    },
    export: {
      filename: "widgets",
      modes: ["current-page"],
      columns: [{ key: "name", label: "Name", value: (row) => row.name }],
    },
  });

  return { resource, queryFn, createFn, reorderFn };
}

function RuntimeProbe() {
  const { dataView, actions } = useResource<
    TestRecord,
    TestValues,
    TestValues
  >();

  return (
    <>
      <output data-testid="runtime-row">
        {dataView.data[0]?.name ?? "none"}
      </output>
      <output data-testid="runtime-data-array">
        {String(Array.isArray(dataView.data))}
      </output>
      <button
        type="button"
        onClick={() => void actions.create({ name: "Created widget" })}
      >
        Create through resource
      </button>
      <button
        type="button"
        onClick={() =>
          void dataView.reorder?.onReorder?.(
            [
              { id: "widget_1", name: "First widget" },
              { id: "widget_2", name: "Second widget" },
            ],
            { activeId: "widget_1", overId: "widget_2", position: "after" }
          )
        }
      >
        Reorder through resource
      </button>
    </>
  );
}

function renderRuntime(
  resource: ReturnType<typeof createResourceRuntimeFixture>["resource"]
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ResourceExecutionContextProvider value={{ storeId: "store_a" }}>
        <TestNavigationProvider navigation={navigation}>
          <ResourceProvider
            definition={resource}
            initialData={{
              items: [{ id: "widget_1", name: "Initial widget" }],
              total: 1,
              page: 1,
              pageSize: 10,
            }}
          >
            <ResourceExport />
            <RuntimeProbe />
          </ResourceProvider>
        </TestNavigationProvider>
      </ResourceExecutionContextProvider>
    </QueryClientProvider>
  );
}

describe("Resource Runtime", () => {
  it("shows an explicit unavailable state when the effective view has no renderer", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const resource = defineResource<TestRecord>({
      metadata: {
        name: "calendar-widgets",
        label: "Calendar Widgets",
        singularLabel: "Calendar Widget",
      },
      views: [{ id: "calendar", type: "calendar", default: true }],
      query: {
        queryKey: () => ["calendar-widgets"],
        queryFn: async () => ({ rows: [{ id: "1", name: "Widget" }], count: 1 }),
        normalize: (response) => response,
      },
      dataView: { columns: [], getRowId: (row) => row.id },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TestNavigationProvider navigation={navigation}>
          <ResourceProvider definition={resource}>
            <ResourceDataView />
          </ResourceProvider>
        </TestNavigationProvider>
      </QueryClientProvider>
    );

    await waitFor(() =>
      expect(screen.getByText("View unavailable")).toBeTruthy()
    );
  });

  it("owns the list query and refreshes server initial data in the background", async () => {
    const { resource, queryFn } = createResourceRuntimeFixture();
    renderRuntime(resource);

    expect(screen.getByTestId("runtime-row").textContent).toBe(
      "Initial widget"
    );
    expect(screen.getByTestId("runtime-data-array").textContent).toBe("true");
    await waitFor(() =>
      expect(screen.getByTestId("runtime-row").textContent).toBe(
        "Fetched widget"
      )
    );
    expect(screen.getByTestId("runtime-data-array").textContent).toBe("true");
    expect(queryFn).toHaveBeenCalled();
  });

  it("normalizes valid, missing-row, and missing-count list values", () => {
    const first = { id: "widget_1", name: "First widget" };
    const second = { id: "widget_2", name: "Second widget" };

    expect(normalizeResourceList([first, second], 2)).toEqual({
      rows: [first, second],
      count: 2,
    });
    expect(normalizeResourceList(undefined, undefined)).toEqual({
      rows: [],
      count: 0,
    });
    expect(normalizeResourceList([first], null)).toEqual({
      rows: [first],
      count: 1,
    });
  });

  it("routes create through the Resource Mutation Adapter", async () => {
    const user = userEvent.setup();
    const { resource, createFn } = createResourceRuntimeFixture();
    renderRuntime(resource);

    await user.click(
      screen.getByRole("button", { name: "Create through resource" })
    );
    await waitFor(() =>
      expect(createFn).toHaveBeenCalledWith(
        { name: "Created widget" },
        expect.objectContaining({
          mutationKey: ["store", "store_a", "resource", "widgets", "create"],
        })
      )
    );
  });

  it("bridges DataView reorder events to the configured resource mutation", async () => {
    const user = userEvent.setup();
    const { resource, reorderFn } = createResourceRuntimeFixture();
    renderRuntime(resource);

    await user.click(
      screen.getByRole("button", { name: "Reorder through resource" })
    );
    await waitFor(() =>
      expect(reorderFn).toHaveBeenCalledWith(
        { id: "widget_1", parentId: null, rank: 0 },
        expect.objectContaining({
          mutationKey: ["store", "store_a", "resource", "widgets", "reorder"],
        })
      )
    );
  });
});
