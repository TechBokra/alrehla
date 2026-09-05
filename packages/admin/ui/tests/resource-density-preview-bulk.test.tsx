import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ResourceContext,
  useResource,
  defineResource,
} from "@eng-mohamedelsayed/admin-core/resource";
import { getDataViewTableState } from "@eng-mohamedelsayed/admin-core/data-view";
import {
  ResourceDensityMenu,
  ResourcePreview,
  ResourcePreviewHeader,
  ResourcePreviewSection,
  ResourcePreviewField,
  ResourcePreviewTrigger,
  ResourceBulkActionBar,
} from "../src/components/resource";
import type { DataTableBulkAction } from "@eng-mohamedelsayed/admin-core/data-view";

interface TestItem {
  id: string;
  name: string;
  status: string;
  price: number;
}

const mockResource = defineResource<TestItem>({
  metadata: {
    name: "products",
    label: "Products",
    singularLabel: "Product",
    pluralLabel: "Products",
  },
  capabilities: {
    create: true,
    update: true,
    delete: true,
    selection: true,
    bulkActions: true,
  },
  forms: {
    create: {
      presentation: "sheet",
      component: () => <div>Create Form</div>,
    },
    update: {
      presentation: "sheet",
      component: () => <div>Update Form</div>,
    },
  },
  dataView: {
    columns: [{ accessorKey: "name", header: "Name" }],
    getRowId: (row) => row.id,
  },
});

function TestHarness({
  selectedIds = [],
  bulkActions,
  onAction = vi.fn(),
}: {
  selectedIds?: string[];
  bulkActions?: DataTableBulkAction<TestItem>[];
  onAction?: (items: TestItem[]) => void;
}) {
  const [rowSelection, setRowSelection] = React.useState<
    Record<string, boolean>
  >(selectedIds.reduce((acc, id) => ({ ...acc, [id]: true }), {}));
  const [density, setDensity] = React.useState<
    "compact" | "comfortable" | "spacious"
  >("comfortable");
  const [previewRecord, setPreviewRecord] = React.useState<TestItem | null>(
    null
  );

  const mockRows: TestItem[] = [
    { id: "1", name: "Product A", status: "Active", price: 100 },
    { id: "2", name: "Product B", status: "Draft", price: 200 },
    { id: "3", name: "Product C", status: "Active", price: 300 },
  ];

  const configuredBulkActions: DataTableBulkAction<TestItem>[] =
    bulkActions ?? [
      {
        id: "archive",
        label: "Archive",
        execute: (rows: TestItem[]) => onAction(rows),
      },
      {
        id: "export",
        label: "Export",
        execute: (rows: TestItem[]) => onAction(rows),
      },
      {
        id: "delete",
        label: "Delete",
        variant: "destructive",
        execute: (rows: TestItem[]) => onAction(rows),
      },
    ];

  const contextValue = {
    definition: defineResource({
      ...mockResource,
      dataView: {
        ...mockResource.dataView,
        bulkActions: configuredBulkActions,
      },
    }),
    capabilities: {
      create: true,
      update: true,
      delete: true,
      import: false,
      export: false,
      bulkActions: true,
      selection: true,
    },
    dataView: {
      data: mockRows,
      state: {
        search: "",
        filters: {},
        sorting: [],
        pagination: { pageIndex: 0, pageSize: 10 },
        columnVisibility: {},
        columnOrder: [],
        rowSelection,
        expanded: {},
      },
      bulkActions: configuredBulkActions,
      onRowSelectionChange: setRowSelection,
    },
    actions: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      reorder: vi.fn(),
      import: vi.fn(),
    },
    pending: {
      create: false,
      update: false,
      delete: false,
      deleteMany: false,
      reorder: false,
      import: false,
    },
    formState: { mode: "closed" as const },
    deleteRecord: null,
    dataTable: null,
    density,
    setDensity,
    previewRecord,
    openPreview: setPreviewRecord,
    closePreview: () => setPreviewRecord(null),
    openCreate: vi.fn(),
    openUpdate: vi.fn(),
    closeForm: vi.fn(),
    openDelete: vi.fn(),
    closeDelete: vi.fn(),
    setDataTable: vi.fn(),
  };

  return (
    <ResourceContext.Provider value={contextValue as never}>
      <ResourceTestConsumer mockRows={mockRows} />
    </ResourceContext.Provider>
  );
}

function ResourceTestConsumer({ mockRows }: { mockRows: TestItem[] }) {
  const { density, setDataTable, dataView } = useResource<TestItem>();
  const mockDataTable = React.useMemo(
    () => ({
      getSelectedRowModel: () => ({
        rows: mockRows
          .filter((row) => getDataViewTableState(dataView.state).rowSelection[row.id])
          .map((row) => ({ original: row, id: row.id })),
      }),
      resetRowSelection: () => dataView.onRowSelectionChange?.({}),
    }),
    [dataView, mockRows]
  );

  React.useEffect(() => {
    setDataTable(mockDataTable as never);
  }, [mockDataTable, setDataTable]);

  return (
    <div>
      <div data-testid="current-density">{density}</div>
      <ResourceDensityMenu />

      {/* Simulated Tree Row */}
      <div data-testid="tree-view-node">
        <ResourcePreviewTrigger
          record={mockRows[0]!}
          data-testid="tree-preview-trigger"
        >
          Tree Item: {mockRows[0]!.name}
        </ResourcePreviewTrigger>
      </div>

      {/* Simulated Table Row Cell */}
      <div data-testid="table-view-cell">
        <ResourcePreviewTrigger
          record={mockRows[1]!}
          data-testid="table-preview-trigger"
        >
          Table Item: {mockRows[1]!.name}
        </ResourcePreviewTrigger>
      </div>

      <ResourcePreview<TestItem>
        render={(record) => (
          <div data-testid="preview-panel">
            <ResourcePreviewHeader
              title={record.name}
              subtitle={`Status: ${record.status}`}
            />
            <ResourcePreviewSection title="Details">
              <ResourcePreviewField label="Price" value={`$${record.price}`} />
              <ResourcePreviewField label="ID" value={record.id} />
            </ResourcePreviewSection>
          </div>
        )}
      />

      <ResourceBulkActionBar />
    </div>
  );
}

describe("Resource UI System — Density, Preview, and Floating Bulk Action Bar", () => {
  it("manages density state and renders density menu without resetting state", async () => {
    const user = userEvent.setup();
    render(<TestHarness selectedIds={["1"]} />);

    expect(screen.getByTestId("current-density").textContent).toBe(
      "comfortable"
    );

    const densityBtn = screen.getByRole("button", {
      name: /Change table density/i,
    });
    await user.click(densityBtn);

    const compactOption = screen.getByText("Compact");
    await user.click(compactOption);

    expect(screen.getByTestId("current-density").textContent).toBe("compact");
    // Selection is preserved when density changes
    expect(screen.getByText(/1 selected/i)).toBeTruthy();
  });

  it("opens quick preview consistently from both Tree and Table triggers", async () => {
    const user = userEvent.setup();
    render(<TestHarness selectedIds={["3"]} />);

    expect(screen.queryByTestId("preview-panel")).toBeNull();

    // 1. Trigger preview from Tree view
    const treeTrigger = screen.getByTestId("tree-preview-trigger");
    await user.click(treeTrigger);

    expect(screen.getByTestId("preview-panel")).toBeTruthy();
    expect(screen.getByText("Product A")).toBeTruthy();
    expect(screen.getByText("$100")).toBeTruthy();

    // Close preview from first item
    const closeBtn1 = screen.getByRole("button", { name: /Close preview/i });
    await user.click(closeBtn1);
    expect(screen.queryByTestId("preview-panel")).toBeNull();

    // 2. Trigger preview from Table view
    const tableTrigger = screen.getByTestId("table-preview-trigger");
    await user.click(tableTrigger);

    expect(screen.getByTestId("preview-panel")).toBeTruthy();
    expect(screen.getByText("Product B")).toBeTruthy();
    expect(screen.getByText("$200")).toBeTruthy();

    // 3. Selection remains intact during preview
    expect(screen.getByText(/1 selected/i)).toBeTruthy();

    // 4. Close preview
    const closeBtn2 = screen.getByRole("button", { name: /Close preview/i });
    await user.click(closeBtn2);

    expect(screen.queryByTestId("preview-panel")).toBeNull();
    expect(screen.getByText(/1 selected/i)).toBeTruthy();
  });

  it("renders generic configured bulk actions and executes them cleanly", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    // Test with Approve & Reject actions
    render(
      <TestHarness
        selectedIds={["1", "2"]}
        onAction={onAction}
        bulkActions={[
          {
            id: "approve",
            label: "Approve",
            execute: (rows: TestItem[]) => onAction(rows),
          },
          {
            id: "reject",
            label: "Reject",
            variant: "destructive",
            execute: (rows: TestItem[]) => onAction(rows),
          },
        ]}
      />
    );

    expect(screen.getByText(/2 selected/i)).toBeTruthy();
    const approveBtn = screen.getByRole("button", { name: "Approve" });
    const rejectBtn = screen.getByRole("button", { name: "Reject" });

    expect(approveBtn).toBeTruthy();
    expect(rejectBtn).toBeTruthy();

    await user.click(approveBtn);
    expect(onAction).toHaveBeenCalledTimes(1);
    // Successful actions clear only the executed explicit selection.
    expect(screen.queryByText(/selected/i)).toBeNull();
  });

  it("places secondary bulk actions (>2) into More dropdown", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    render(<TestHarness selectedIds={["1", "2"]} onAction={onAction} />);

    expect(screen.getByRole("button", { name: "Archive" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Export" })).toBeTruthy();

    // Third action is inside More dropdown
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();

    const moreBtn = screen.getByRole("button", { name: /More/i });
    await user.click(moreBtn);

    const deleteMenuItem = screen.getByText("Delete");
    await user.click(deleteMenuItem);

    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
