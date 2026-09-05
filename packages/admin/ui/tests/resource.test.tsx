import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ResourceProvider,
  ResourceExecutionContextProvider,
  defineResource,
  resolveResourceCapabilities,
  resolveResourceRowActions,
  useResource,
  type ResourceDefinition,
  type ResourceMutationAdapters,
} from "@eng-mohamedelsayed/admin-core/resource";
import {
  ResourceCreate,
  ResourcePageHeader,
  ResourceRowActions,
} from "../src/components/resource";
import { TestNavigationProvider } from "./test-navigation-provider";

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn(), replace: vi.fn() },
  searchParams: new URLSearchParams(),
}));

type TestRecord = { id: string; name: string };

const record: TestRecord = { id: "widget_1", name: "First widget" };

function TestIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return <svg data-testid="widget-icon" className={className} {...props} />;
}

interface TestFormProps {
  mode: "create" | "update";
  record?: TestRecord;
  title: string;
}

function TestForm({
  mode,
  record: formRecord,
  title,
}: TestFormProps) {
  return (
    <div data-testid={`${mode}-form`}>
      {title} {formRecord?.name ?? ""}
    </div>
  );
}

function TestWizardForm({ title }: Pick<TestFormProps, "title">) {
  return <div data-testid="wizard-form">{title}</div>;
}

function createDefinition(
  capabilities: { create?: boolean; update?: boolean; delete?: boolean } = {
    create: true,
    update: true,
    delete: true,
  }
): ResourceDefinition<TestRecord> {
  return defineResource<TestRecord>({
    scope: "store",
    metadata: {
      name: "widgets",
      label: "Widgets",
      singularLabel: "Widget",
      description: "Manage test widgets.",
      icon: TestIcon,
    },
    capabilities,
    dataView: {
      columns: [{ accessorKey: "name", header: "Name" }],
      getRowId: (row) => row.id,
      pageSizeOptions: [10, 20],
    },
    query: {
      queryKey: () => ["widgets"],
      queryFn: async () => ({ rows: [record], count: 1 }),
      normalize: (response) => response,
    },
    mutations: {
      create: { mutationFn: async () => undefined },
      update: {
        mutationFn: async () => undefined,
        getInput: ({ record: currentRecord, values }) => ({
          record: currentRecord,
          values,
        }),
      },
      delete: {
        mutationFn: async (id: string) => id,
        getInput: (item) => item.id,
      },
    },
    forms: {
      create: {
        presentation: "wizard",
        managesPresentation: true,
        component: TestWizardForm,
      },
      update: { presentation: "sheet", component: TestForm },
    },
    pagination: { enabled: true },
  });
}

function ResourceStateProbe() {
  const resource = useResource<TestRecord>();
  const formState =
    resource.formState.mode === "update"
      ? `update:${resource.formState.record.name}`
      : resource.formState.mode;

  return (
    <>
      <output data-testid="metadata">
        {resource.definition.metadata.label}
      </output>
      <output data-testid="capabilities">
        {String(resource.definition.capabilities?.create)}
        {String(resource.definition.capabilities?.update)}
        {String(resource.definition.capabilities?.delete)}
      </output>
      <output data-testid="form-state">{formState}</output>
      <output data-testid="delete-record">
        {resource.deleteRecord?.name ?? ""}
      </output>
      <button type="button" onClick={resource.openCreate}>
        Open create
      </button>
      <button type="button" onClick={() => resource.openUpdate(record)}>
        Open update
      </button>
      <button type="button" onClick={() => resource.openDelete(record)}>
        Open delete
      </button>
      <button type="button" onClick={resource.closeForm}>
        Close form
      </button>
      <button type="button" onClick={resource.closeDelete}>
        Close delete
      </button>
    </>
  );
}

function renderResource(
  definition = createDefinition(),
  children: React.ReactNode = <ResourceStateProbe />,
  mutations?: ResourceMutationAdapters<TestRecord, string>
) {
  const deleteAdapter = mutations?.delete;
  const runtimeDefinition = deleteAdapter
    ? defineResource({
        ...definition,
        mutations: {
          ...definition.mutations,
          delete: {
            ...definition.mutations?.delete,
            mutationFn: (input: string) => deleteAdapter.mutateAsync(input),
            getInput:
              definition.mutations?.delete?.getInput ?? ((item) => item.id),
            ...(deleteAdapter.getLabel
              ? { getLabel: deleteAdapter.getLabel }
              : {}),
          },
        },
      })
    : definition;
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ResourceExecutionContextProvider value={{ storeId: "store_a" }}>
        <TestNavigationProvider navigation={navigation}>
          <ResourceProvider
            definition={runtimeDefinition}
            initialData={{ rows: [record], count: 1 }}
          >
            {children}
          </ResourceProvider>
        </TestNavigationProvider>
      </ResourceExecutionContextProvider>
    </QueryClientProvider>
  );
}

describe("ResourceProvider", () => {
  it("provides metadata and capabilities and manages create, update, and delete state", async () => {
    const user = userEvent.setup();
    renderResource(createDefinition(), undefined, {
      delete: {
        isPending: false,
        mutateAsync: vi.fn().mockResolvedValue(undefined),
        getInput: (item) => item.id,
      },
    });

    expect(screen.getByTestId("metadata").textContent).toBe("Widgets");
    expect(screen.getByTestId("capabilities").textContent).toBe("truetruetrue");
    expect(screen.getByTestId("form-state").textContent).toBe("closed");

    await user.click(screen.getByRole("button", { name: "Open create" }));
    expect(screen.getByTestId("form-state").textContent).toBe("create");
    await user.click(screen.getByRole("button", { name: "Close form" }));
    expect(screen.getByTestId("form-state").textContent).toBe("closed");

    await user.click(screen.getByRole("button", { name: "Open update" }));
    expect(screen.getByTestId("form-state").textContent).toBe(
      "update:First widget"
    );
    await user.click(screen.getByRole("button", { name: "Close form" }));
    expect(screen.getByTestId("form-state").textContent).toBe("closed");

    await user.click(screen.getByRole("button", { name: "Open delete" }));
    expect(screen.getByTestId("delete-record").textContent).toBe(
      "First widget"
    );
    await user.click(screen.getByRole("button", { name: "Close delete" }));
    expect(screen.getByTestId("delete-record").textContent).toBe("");
  });
});

describe("Resource primitives", () => {
  it("uses metadata for the create button and opens the create form", async () => {
    const user = userEvent.setup();
    renderResource(
      createDefinition(),
      <>
        <ResourceCreate />
        <ResourceStateProbe />
      </>
    );

    const button = screen.getByRole("button", { name: "Create Widget" });
    expect(
      button.querySelector("svg[data-testid='widget-icon']")
    ).not.toBeNull();
    await user.click(button);
    expect(screen.getByTestId("form-state").textContent).toBe("create");
  });

  it("renders no create button when create capability is disabled", () => {
    renderResource(
      createDefinition({ create: false, update: true, delete: true }),
      <ResourceCreate />
    );
    expect(screen.queryByRole("button", { name: /Create Widget/ })).toBeNull();
  });

  it("derives the page header from resource metadata", () => {
    renderResource(createDefinition(), <ResourcePageHeader />);

    expect(screen.getByRole("heading", { name: "Widgets" })).toBeTruthy();
    expect(screen.getByText("Manage test widgets.")).toBeTruthy();
    expect(screen.getByTestId("widget-icon")).toBeTruthy();
  });
});

describe("Resource row actions", () => {
  it("shows update and delete actions when both capabilities are enabled", async () => {
    const user = userEvent.setup();
    const definition = createDefinition();
    const capabilities = resolveResourceCapabilities(definition);
    const actions = resolveResourceRowActions(definition, capabilities);
    render(
      <ResourceRowActions
        record={record}
        singularLabel="Widget"
        {...(actions.edit ? { onEdit: vi.fn() } : {})}
        {...(actions.delete ? { onDelete: vi.fn() } : {})}
      />
    );

    await user.click(
      await screen.findByRole("button", { name: "Open actions" })
    );
    expect(
      await screen.findByRole("menuitem", { name: "Edit Widget" })
    ).toBeTruthy();
    expect(
      await screen.findByRole("menuitem", { name: "Delete Widget" })
    ).toBeTruthy();
  });

  it("removes each unavailable action according to its capability", async () => {
    const user = userEvent.setup();
    const updateUnavailable = createDefinition({
      create: true,
      update: false,
      delete: true,
    });
    const updateUnavailableActions = resolveResourceRowActions(
      updateUnavailable,
      resolveResourceCapabilities(updateUnavailable)
    );
    const { unmount } = render(
      <ResourceRowActions
        record={record}
        singularLabel="Widget"
        {...(updateUnavailableActions.edit ? { onEdit: vi.fn() } : {})}
        {...(updateUnavailableActions.delete ? { onDelete: vi.fn() } : {})}
      />
    );

    await user.click(
      await screen.findByRole("button", { name: "Open actions" })
    );
    expect(screen.queryByRole("menuitem", { name: "Edit Widget" })).toBeNull();
    expect(
      await screen.findByRole("menuitem", { name: "Delete Widget" })
    ).toBeTruthy();
    unmount();

    const deleteUnavailable = createDefinition({
      create: true,
      update: true,
      delete: false,
    });
    const deleteUnavailableActions = resolveResourceRowActions(
      deleteUnavailable,
      resolveResourceCapabilities(deleteUnavailable)
    );
    render(
      <ResourceRowActions
        record={record}
        singularLabel="Widget"
        {...(deleteUnavailableActions.edit ? { onEdit: vi.fn() } : {})}
        {...(deleteUnavailableActions.delete ? { onDelete: vi.fn() } : {})}
      />
    );
    await user.click(
      await screen.findByRole("button", { name: "Open actions" })
    );
    expect(
      await screen.findByRole("menuitem", { name: "Edit Widget" })
    ).toBeTruthy();
    expect(
      screen.queryByRole("menuitem", { name: "Delete Widget" })
    ).toBeNull();
  });
});
