import * as React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DataTableHierarchyCell } from "../src/components/data-table/columns/data-table-hierarchy-cell";
import { getDataTableOrderColumn } from "../src/components/data-table/columns/data-table-order-column";
import { DataTable } from "../src/components/data-table/core/data-table";
import {
  flatToDataViewTree,
  moveDataViewHierarchyRow,
  nestDataViewHierarchyRow,
} from "../src/components/data-table/hierarchy/data-view-hierarchy";
import type { DataViewHierarchyConfig } from "@eng-mohamedelsayed/admin-core/data-view";

describe("DataTableHierarchyCell", () => {
  it("renders root item with title and subtitle without branch connector", () => {
    const { container } = render(
      <DataTableHierarchyCell
        depth={0}
        title="Clothing"
        subtitle="/clothing"
      />
    );

    expect(screen.getByText("Clothing")).toBeTruthy();
    expect(screen.getByText("/clothing")).toBeTruthy();
    expect(container.querySelector("svg.lucide-corner-down-right")).toBeNull();
  });

  it("renders nested item with depth indentation", () => {
    const { container } = render(
      <DataTableHierarchyCell
        depth={2}
        title="T-Shirts"
        subtitle="/clothing/shirts/t-shirts"
      />
    );

    expect(screen.getByText("T-Shirts")).toBeTruthy();
    const cellRoot = container.firstElementChild as HTMLElement;
    expect(cellRoot.style.paddingLeft).toBe("4.5rem");
  });

  it("renders expand toggle button when node has children", () => {
    const onToggle = vi.fn();
    render(
      <DataTableHierarchyCell
        depth={0}
        title="Clothing"
        hasChildren={true}
        isExpanded={false}
        onToggleExpand={onToggle}
      />
    );

    const expandBtn = screen.getByRole("button", { name: "Expand branch" });
    expect(expandBtn).toBeTruthy();
    expandBtn.click();
    expect(onToggle).toHaveBeenCalled();
  });
});

describe("getDataTableOrderColumn", () => {
  it("renders rank/order badge in table", () => {
    type RowData = { id: string; name: string; rank: number };
    const testRows: RowData[] = [
      { id: "1", name: "Alpha", rank: 10 },
      { id: "2", name: "Beta", rank: 20 },
    ];

    const columns = [
      { accessorKey: "name", header: "Name" },
      getDataTableOrderColumn<RowData>({
        accessorKey: "rank",
        title: "Sort Order",
      }),
    ];

    render(
      <DataTable
        columns={columns}
        data={testRows}
        getRowId={(r) => r.id}
      />
    );

    expect(screen.getByText("Sort Order")).toBeTruthy();
    expect(screen.getAllByText("10").length).toBeGreaterThan(0);
    expect(screen.getByText("20")).toBeTruthy();
  });
});

describe("nestDataViewHierarchyRow (Drag & Drop to make child)", () => {
  type CategoryTestRow = {
    id: string;
    name: string;
    parentId: string | null;
    rank: number;
    descendantIds?: string[];
  };

  const testConfig: DataViewHierarchyConfig<CategoryTestRow> = {
    enabled: true,
    getRowId: (row) => row.id,
    getParentId: (row) => row.parentId,
    getOrder: (row) => row.rank,
    allowReparent: true,
    updateRow: (row, update) => ({
      ...row,
      parentId: update.parentId,
      rank: update.rank,
    }),
  };

  const sampleRows: CategoryTestRow[] = [
    { id: "cat-1", name: "Electronics", parentId: null, rank: 0, descendantIds: ["cat-1-1"] },
    { id: "cat-1-1", name: "Laptops", parentId: "cat-1", rank: 0 },
    { id: "cat-2", name: "Fashion", parentId: null, rank: 1, descendantIds: ["cat-2-1"] },
    { id: "cat-2-1", name: "Shoes", parentId: "cat-2", rank: 0 },
    { id: "cat-3", name: "Books", parentId: null, rank: 2 },
  ];

  it("nests a root element into another element so it becomes its child", () => {
    // Drag cat-3 into cat-1 -> cat-3 should become a child of cat-1
    const result = nestDataViewHierarchyRow(sampleRows, "cat-3", "cat-1", testConfig);

    expect(result.moved.id).toBe("cat-3");
    expect(result.moved.parentId).toBe("cat-1");

    const tree = flatToDataViewTree(result.rows, testConfig);
    const electronics = tree.find((node) => node.meta.id === "cat-1");
    expect(electronics).toBeDefined();
    expect(electronics?.children.map((c) => c.meta.id)).toContain("cat-3");
  });

  it("nests a child of one parent into another parent (reparenting)", () => {
    // Drag cat-2-1 (Shoes under Fashion) into cat-1 (Electronics) -> Shoes becomes child of Electronics
    const result = nestDataViewHierarchyRow(sampleRows, "cat-2-1", "cat-1", testConfig);

    expect(result.moved.id).toBe("cat-2-1");
    expect(result.moved.parentId).toBe("cat-1");

    const tree = flatToDataViewTree(result.rows, testConfig);
    const electronics = tree.find((node) => node.meta.id === "cat-1");
    expect(electronics?.children.map((c) => c.meta.id)).toContain("cat-2-1");

    const fashion = tree.find((node) => node.meta.id === "cat-2");
    expect(fashion?.children.map((c) => c.meta.id)).not.toContain("cat-2-1");
  });

  it("promotes a child element to root when nested target is null", () => {
    // Drag cat-1-1 (Laptops under Electronics) to root (null)
    const result = nestDataViewHierarchyRow(sampleRows, "cat-1-1", null, testConfig);

    expect(result.moved.id).toBe("cat-1-1");
    expect(result.moved.parentId).toBeNull();

    const tree = flatToDataViewTree(result.rows, testConfig);
    expect(tree.map((node) => node.meta.id)).toContain("cat-1-1");
  });

  it("prevents cyclic nesting (cannot nest parent into its own child/descendant)", () => {
    // Drag cat-1 into cat-1-1 -> Should be prevented (no cycle)
    const result = nestDataViewHierarchyRow(sampleRows, "cat-1", "cat-1-1", testConfig);

    // Should return unchanged rows and no updates
    expect(result.updates.length).toBe(0);
    const tree = flatToDataViewTree(result.rows, testConfig);
    const electronics = tree.find((node) => node.meta.id === "cat-1");
    expect(electronics?.meta.parentId).toBeNull();
  });

  it("supports position 'inside' in moveDataViewHierarchyRow", () => {
    const result = moveDataViewHierarchyRow(
      sampleRows,
      "cat-3",
      "cat-2",
      testConfig,
      "inside"
    );

    expect(result.moved.id).toBe("cat-3");
    expect(result.moved.parentId).toBe("cat-2");

    const tree = flatToDataViewTree(result.rows, testConfig);
    const fashion = tree.find((node) => node.meta.id === "cat-2");
    expect(fashion?.children.map((c) => c.meta.id)).toContain("cat-3");
  });
});
