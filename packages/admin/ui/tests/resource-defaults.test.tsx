import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ResourceProvider,
  ResourceExecutionContextProvider,
  defineResource,
  resolveResourceBulkActions,
  resolveResourceCapabilities,
  resolveResourcePagination,
  resolveResourceRowActions,
  useResource,
} from "@eng-mohamedelsayed/admin-core/resource";
import { ResourceEmptyState } from "../src/components/resource";
import type { DataViewState } from "@eng-mohamedelsayed/admin-core/data-view";
import { TestNavigationProvider } from "./test-navigation-provider";

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn(), replace: vi.fn() },
  searchParams: new URLSearchParams(),
}));

type Row = { id: string; name: string };
type Values = { name: string };

const dataViewState = (
  overrides: Partial<DataViewState> = {}
): DataViewState => ({
  search: "",
  filters: {},
  sorting: [],
  activeView: "table",
  viewState: {
    table: {
      pagination: { pageIndex: 0, pageSize: 10 },
      columnVisibility: {},
      columnOrder: [],
      rowSelection: {},
      expanded: {},
    } as never,
  },
  ...overrides,
});

function Form() {
  return null;
}

function createFullDefinition() {
  return defineResource<Row, Values, Values>({
    metadata: {
      name: "widgets",
      label: "Widgets",
      singularLabel: "Widget",
    },
    dataView: {
      columns: [{ accessorKey: "name", header: "Name" }],
      getRowId: (row) => row.id,
    },
    forms: {
      create: { component: Form },
      update: { component: Form },
    },
    mutations: {
      create: { mutationFn: vi.fn() },
      update: {
        mutationFn: vi.fn(),
        getInput: ({ record, values }) => ({ record, values }),
      },
      delete: { mutationFn: vi.fn(), getInput: (row) => row.id },
      deleteMany: {
        mutationFn: vi.fn(),
        getInput: (rows) => rows.map((row) => row.id),
      },
    },
    export: {
      filename: "widgets",
      modes: ["current-page"],
      columns: [{ key: "name", label: "Name", value: (row) => row.name }],
    },
  });
}

describe("Resource defaults and effective action resolution", () => {
  it("enables standard capabilities, actions, bulk delete, and pagination when implementations exist", () => {
    const definition = createFullDefinition();
    const capabilities = resolveResourceCapabilities(definition);

    expect(capabilities).toEqual({
      create: true,
      update: true,
      delete: true,
      import: false,
      export: true,
      bulkActions: true,
      selection: true,
    });
    expect(resolveResourceRowActions(definition, capabilities)).toMatchObject({
      edit: true,
      delete: true,
    });
    expect(resolveResourceBulkActions(definition, capabilities).delete).toBe(
      true
    );
    expect(resolveResourcePagination(definition)).toEqual({
      enabled: true,
      pageSizeOptions: [10, 20, 30, 50, 100],
    });
  });

  it("lets explicit false disable only the requested defaults", () => {
    const definition = defineResource({
      ...createFullDefinition(),
      capabilities: { delete: false, selection: false },
      rowActions: { edit: false },
      bulkActions: { delete: false },
      pagination: { enabled: false, pageSizeOptions: [25, 50, 100] },
    });
    const capabilities = resolveResourceCapabilities(definition);

    expect(capabilities.delete).toBe(false);
    expect(capabilities.selection).toBe(false);
    expect(capabilities.bulkActions).toBe(false);
    expect(capabilities.create).toBe(true);
    expect(resolveResourceRowActions(definition, capabilities)).toMatchObject({
      edit: false,
      delete: false,
    });
    expect(resolveResourceBulkActions(definition, capabilities).delete).toBe(
      false
    );
    expect(resolveResourcePagination(definition)).toEqual({
      enabled: false,
      pageSizeOptions: [25, 50, 100],
    });
  });

  it("does not advertise actions whose form or mutation implementation is missing", () => {
    const definition = defineResource<Row>({
      metadata: { name: "widgets", label: "Widgets", singularLabel: "Widget" },
      dataView: {
        columns: [{ accessorKey: "name", header: "Name" }],
        getRowId: (row) => row.id,
      },
    });
    const capabilities = resolveResourceCapabilities(definition);

    expect(capabilities.create).toBe(false);
    expect(capabilities.update).toBe(false);
    expect(capabilities.delete).toBe(false);
    expect(resolveResourceRowActions(definition, capabilities)).toMatchObject({
      edit: false,
      delete: false,
    });
    expect(resolveResourceBulkActions(definition, capabilities).delete).toBe(
      false
    );
  });
});

function EmptyStateProbe() {
  const resource = useResource<Row, Values, Values>();
  return <output data-testid="form-state">{resource.formState.mode}</output>;
}

function renderEmptyState(
  definition: ReturnType<typeof createFullDefinition>,
  state = dataViewState()
) {
  // ResourceProvider derives DataView state from the URL adapter. Keep this
  // test deterministic by installing the requested state in the local router
  // fixture rather than relying on the removed `dataView` provider prop.
  navigation.searchParams = new URLSearchParams();
  if (state.search) navigation.searchParams.set("q", state.search);
  for (const [key, value] of Object.entries(state.filters)) {
    if (Array.isArray(value)) navigation.searchParams.set(key, value.join(","));
    else if (value !== undefined && value !== null) {
      navigation.searchParams.set(key, String(value));
    }
  }

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ResourceExecutionContextProvider value={{ storeId: "store_a" }}>
        <TestNavigationProvider navigation={navigation}>
          <ResourceProvider definition={definition}>
            <ResourceEmptyState />
            <EmptyStateProbe />
          </ResourceProvider>
        </TestNavigationProvider>
      </ResourceExecutionContextProvider>
    </QueryClientProvider>
  );
}

describe("Resource empty states", () => {
  it("shows a resource-aware empty state and reuses the Resource create action", async () => {
    const user = userEvent.setup();
    renderEmptyState(createFullDefinition());

    expect(screen.getByText("No widgets yet")).toBeTruthy();
    expect(
      screen.getByText("Create your first widget to get started.")
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Create Widget" }));
    expect(screen.getByTestId("form-state").textContent).toBe("create");
  });

  it("uses a no-results state and reset action for active search/filter state", async () => {
    const user = userEvent.setup();
    const view = renderEmptyState(
      createFullDefinition(),
      dataViewState({ search: "missing", filters: { status: "active" } })
    );

    expect(screen.getByText("No results found")).toBeTruthy();
    expect(
      screen.getByText("No widgets match the current search or filters.")
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Create Widget" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(view.container).toBeTruthy();
  });

  it("does not show a create CTA when create is unavailable", () => {
    const { forms: _forms, ...definitionWithoutForms } = createFullDefinition();
    const definition = defineResource({
      ...definitionWithoutForms,
      capabilities: { create: false },
    });
    renderEmptyState(definition);

    expect(
      screen.getByText("There are currently no widgets to display.")
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Create Widget" })).toBeNull();
  });
});
