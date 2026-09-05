import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ColumnDef } from "@tanstack/react-table";
import { describe, expect, it, vi } from "vitest";
import { DataTable } from "../src/components/data-table/core/data-table";
import { reorderDataTableRows } from "../src/components/data-table/reorder/data-table-reorder";

import { DataTableBulkActions } from "../src/components/data-table/actions/data-table-bulk-actions";

type TestRow = { id: string; name: string; status: string };

const rows: TestRow[] = [
  { id: "one", name: "One", status: "Active" },
  { id: "two", name: "Two", status: "Draft" },
  { id: "three", name: "Three", status: "Active" },
];

const columns: ColumnDef<TestRow>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "status", header: "Status" },
];

function renderTable(
  overrides: Partial<
    React.ComponentProps<typeof DataTable<TestRow, unknown>>
  > = {}
) {
  return render(
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      selection={{ enabled: true, getRowId: (row) => row.id }}
      renderBulkActions={(table) => (
        <DataTableBulkActions
          table={table}
          actions={[
            {
              id: "delete",
              label: "Delete",
              confirmation: { resourceName: "items" },
              execute: vi.fn(),
            },
          ]}
        />
      )}
      {...overrides}
    />
  );
}

describe("DataTable selection and bulk actions", () => {
  it("distinguishes an empty resource from a filtered no-match result", () => {
    renderTable({
      data: [],
      emptyTitle: "No matching categories",
      emptyDescription: "Clear the search to see every category.",
      emptyAction: <button>Clear search</button>,
    });

    expect(screen.getByText("No matching categories")).toBeTruthy();
    expect(
      screen.getByText("Clear the search to see every category.")
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Clear search" })).toBeTruthy();
  });

  it("selects rows, supports current-page select-all, and shows the animated bar", async () => {
    const user = userEvent.setup();
    renderTable();

    expect(screen.getByText("0 selected")).toBeTruthy();
    await user.click(screen.getByRole("checkbox", { name: "Select row one" }));
    expect(screen.getByText("1 selected")).toBeTruthy();

    await user.click(
      screen.getByRole("checkbox", { name: "Select all rows on this page" })
    );
    expect(screen.getByText("3 selected")).toBeTruthy();

    await user.click(
      screen.getByRole("checkbox", { name: "Select all rows on this page" })
    );
    expect(screen.getByText("0 selected")).toBeTruthy();
  });

  it("confirms bulk deletion, passes stable IDs, and clears selection", async () => {
    const user = userEvent.setup();
    const execute = vi.fn().mockResolvedValue(undefined);
    render(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        selection={{ enabled: true, getRowId: (row) => row.id }}
        renderBulkActions={(table) => (
          <DataTableBulkActions
            table={table}
            actions={[
              {
                id: "delete",
                label: "Delete",
                confirmation: { resourceName: "items" },
                execute,
              },
            ]}
          />
        )}
      />
    );

    await user.click(screen.getByRole("checkbox", { name: "Select row one" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(
      screen.getByRole("heading", { name: "Delete 1 items?" })
    ).toBeTruthy();
    expect(execute).not.toHaveBeenCalled();

    const dialog = screen.getByRole("alertdialog");
    await user.click(
      dialog.querySelector("button.bg-destructive") ??
        screen.getAllByRole("button", { name: "Delete" }).at(-1)!
    );
    await waitFor(() => expect(execute).toHaveBeenCalledWith([rows[0]]));
    expect(screen.getByText("0 selected")).toBeTruthy();
  });

  it("passes authoritative executeIds instead of re-deriving IDs from rows", async () => {
    const user = userEvent.setup();
    const executeIds = vi.fn().mockResolvedValue(undefined);
    render(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        rowSelection={{ one: true, two: true }}
        selection={{ enabled: true, getRowId: (row) => row.id }}
        renderBulkActions={(table) => (
          <DataTableBulkActions
            table={table}
            selection={{
              mode: "explicit",
              selectedIds: ["one", "two"],
              executeIds: ["two"],
            }}
            actions={[{ id: "archive", label: "Archive", executeIds }]}
          />
        )}
      />
    );

    await user.click(screen.getByRole("button", { name: "Archive" }));
    await waitFor(() =>
      expect(executeIds).toHaveBeenCalledWith(["two"], [rows[0], rows[1]])
    );
  });

  it("hides and restores configurable columns while keeping selection controls", async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(
      screen.getByRole("button", { name: "Toggle visible columns" })
    );
    const statusToggles = screen.getAllByText(/status/i);
    await user.click(statusToggles[statusToggles.length - 1]!);
    expect(screen.queryByText("Active")).toBeNull();
    expect(
      screen.getByRole("checkbox", { name: "Select row one" })
    ).toBeTruthy();

    await user.click(
      screen.getByRole("button", { name: "Toggle visible columns" })
    );
    const updatedStatusToggles = screen.getAllByText(/status/i);
    await user.click(updatedStatusToggles[updatedStatusToggles.length - 1]!);
    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
  });

  it("opens field selection export dialog when clicking Export in bulk actions bar", async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByRole("checkbox", { name: "Select row one" }));
    const exportBtn = screen.getByRole("button", { name: "Export" });
    expect(exportBtn).toBeTruthy();

    const printBtn = screen.getByRole("button", { name: "Print" });
    expect(printBtn).toBeTruthy();

    await user.click(exportBtn);
    expect(screen.getByText("Export records")).toBeTruthy();
    expect(screen.getByText(/Fields to include/)).toBeTruthy();
  });
});

describe("DataTable loading boundary", () => {
  it("keeps the toolbar and table header visible while loading the body", () => {
    renderTable({
      data: [],
      loading: true,
      searchKey: "name",
      searchPlaceholder: "Search names...",
    });

    expect(screen.getByPlaceholderText("Search names...")).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeTruthy();
    expect(screen.getAllByRole("row")).toHaveLength(6);
    expect(screen.queryByText("No results found")).toBeNull();
  });

  it("renders rows during refetch and preserves the refetch opacity", () => {
    const { container } = renderTable({ isRefetching: true });

    expect(screen.getByText("One")).toBeTruthy();
    expect(screen.getByText("Two")).toBeTruthy();
    expect(container.querySelector(".opacity-70")).toBeTruthy();
  });
});

describe("DataTable reordering", () => {
  it("renders a dedicated drag handle without selecting its row", async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        selection={{ enabled: true, getRowId: (row) => row.id }}
        reorder={{ enabled: true, onReorder: vi.fn() }}
      />
    );

    const handle = screen.getAllByRole("button", { name: "Reorder row" })[0]!;
    expect(handle).toBeTruthy();
    await user.click(handle);
    expect(
      screen
        .getByRole("checkbox", { name: "Select row one" })
        .getAttribute("aria-checked")
    ).toBe("false");
  });

  it("calculates a stable ID-based reorder payload", () => {
    expect(
      reorderDataTableRows(rows, "one", "three", (row) => row.id).map(
        (row) => row.id
      )
    ).toEqual(["two", "three", "one"]);
  });

  it("does not render checkboxes when checkbox prop is false", () => {
    render(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        checkbox={false}
      />
    );
    expect(
      screen.queryByRole("checkbox", { name: "Select row one" })
    ).toBeNull();
  });

  it("renders checkboxes in first column when checkbox prop is true", () => {
    render(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        checkbox={true}
        reorder={{ enabled: true, onReorder: vi.fn() }}
      />
    );
    expect(
      screen.getByRole("checkbox", { name: "Select row one" })
    ).toBeTruthy();
  });
});

describe("DataTableToolbar search and filter support", () => {
  it("renders without error and omits search input when searchKey/onSearchChange are omitted", () => {
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});
    render(
      <DataTable columns={columns} data={rows} getRowId={(row) => row.id} />
    );

    expect(screen.queryByPlaceholderText("Search...")).toBeNull();
    expect(consoleWarnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("Column with id 'title' does not exist")
    );
    consoleWarnSpy.mockRestore();
  });

  it("filters rows when searchKey is provided", async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        processingMode="client"
        searchKey="name"
        searchPlaceholder="Search names..."
      />
    );

    const input = screen.getByPlaceholderText("Search names...");
    expect(input).toBeTruthy();

    await user.type(input, "One");
    expect(screen.getByText("One")).toBeTruthy();
    expect(screen.queryByText("Two")).toBeNull();
    expect(screen.queryByText("Three")).toBeNull();
  });
});
