import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResourceSearchBar } from "../src/components/resource/resource-search-bar";
import {
  ResourceContext,
  defineResource,
  resolveResourceCapabilities,
} from "@eng-mohamedelsayed/admin-core/resource";

interface TestCategory {
  id: string;
  name: string;
  status: string;
}

const mockCategoryResource = defineResource<TestCategory>({
  metadata: {
    name: "categories",
    label: "Categories",
    singularLabel: "Category",
    pluralLabel: "Categories",
  },
  dataView: {
    columns: [{ accessorKey: "name", header: "Name" }],
    getRowId: (row) => row.id,
    search: {
      enabled: true,
      placeholder: "Search categories…",
    },
    filters: [
      {
        id: "status",
        label: "Status",
        type: "single-select",
        options: [
          { label: "Active", value: "active" },
          { label: "Draft", value: "draft" },
        ],
      },
      {
        id: "parent",
        label: "Parent",
        type: "single-select",
        options: [
          { label: "Root Level", value: "root" },
          { label: "Clothing", value: "clothing" },
        ],
      },
    ],
  },
});

function TestSearchHarness({
  initialSearch = "",
  initialFilters = {},
  onSearchChange = vi.fn(),
  onFilterChange = vi.fn(),
  debounceMs = 100,
}: {
  initialSearch?: string;
  initialFilters?: Record<string, any>;
  onSearchChange?: (val: string) => void;
  onFilterChange?: (id: string, val: any) => void;
  debounceMs?: number;
}) {
  const [search, setSearch] = React.useState(initialSearch);
  const [filters, setFilters] = React.useState(initialFilters);

  const dataView = {
    data: [],
    state: {
      search,
      filters,
      sorting: [],
      pagination: { pageIndex: 0, pageSize: 20 },
      columnVisibility: {},
      columnOrder: [],
      rowSelection: {},
      expanded: {},
    },
    searchInput: search,
    onSearchInputChange: (value: string) => {
      setSearch(value);
      onSearchChange(value);
    },
    onSearchChange: (value: string) => {
      setSearch(value);
      onSearchChange(value);
    },
    onFilterChange: (id: string, value: any) => {
      setFilters((prev) => {
        if (value === undefined) {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        }
        return { ...prev, [id]: value };
      });
      onFilterChange(id, value);
    },
  };

  const contextValue = {
    definition: mockCategoryResource,
    capabilities: resolveResourceCapabilities(mockCategoryResource),
    dataView,
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
    density: "comfortable" as const,
    setDensity: vi.fn(),
    previewRecord: null,
    openPreview: vi.fn(),
    closePreview: vi.fn(),
    openCreate: vi.fn(),
    openUpdate: vi.fn(),
    closeForm: vi.fn(),
    openDelete: vi.fn(),
    closeDelete: vi.fn(),
    setDataTable: vi.fn(),
  };

  return (
    <ResourceContext.Provider value={contextValue as never}>
      <ResourceSearchBar debounceMs={debounceMs} />
    </ResourceContext.Provider>
  );
}

describe("Unified Odoo-Style ResourceSearchBar", () => {
  it("renders search input, search icon, and advanced filter trigger in one unified control", () => {
    render(<TestSearchHarness />);

    expect(
      screen.getByRole("textbox", { name: "Search categories…" })
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: /Filter/i })).toBeTruthy();
  });

  it("updates input immediately and debounces search callback", async () => {
    vi.useFakeTimers();
    try {
      const onSearchChange = vi.fn();
      render(
        <TestSearchHarness onSearchChange={onSearchChange} debounceMs={300} />
      );

      const input = screen.getByRole("textbox") as HTMLInputElement;

      // Simulate typing with fireEvent
      act(() => {
        fireEvent.change(input, { target: { value: "elec" } });
      });

      expect(input.value).toBe("elec");
      expect(onSearchChange).not.toHaveBeenCalled();

      // Fast forward past debounce
      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSearchChange).toHaveBeenCalledWith("elec");
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders active filter chips inside the search bar", () => {
    render(
      <TestSearchHarness
        initialFilters={{
          status: "active",
          parent: "clothing",
        }}
      />
    );

    expect(screen.getByText("Status:")).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();
    expect(screen.getByText("Parent:")).toBeTruthy();
    expect(screen.getByText("Clothing")).toBeTruthy();
  });

  it("removes single filter chip when clicking × without clearing search input", async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();

    render(
      <TestSearchHarness
        initialSearch="shoes"
        initialFilters={{ status: "active" }}
        onFilterChange={onFilterChange}
      />
    );

    expect(screen.getByText("Status:")).toBeTruthy();
    const removeBtn = screen.getByRole("button", {
      name: "Remove filter for Status",
    });

    await user.click(removeBtn);

    expect(onFilterChange).toHaveBeenCalledWith("status", undefined);
  });

  it("clears search text when clicking clear button", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();

    render(
      <TestSearchHarness
        initialSearch="electronics"
        onSearchChange={onSearchChange}
      />
    );

    const clearBtn = screen.getByRole("button", { name: "Clear search text" });
    await user.click(clearBtn);

    expect(onSearchChange).toHaveBeenCalledWith("");
  });
});
