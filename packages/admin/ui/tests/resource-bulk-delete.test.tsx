import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ResourceProvider,
  ResourceExecutionContextProvider,
  defineResource,
  normalizeResourceList,
  useResource,
} from "@eng-mohamedelsayed/admin-core/resource";
import { ResourceBulkActionBar } from "../src/components/resource";
import { TestNavigationProvider } from "./test-navigation-provider";

const navigation = {
  router: { push: vi.fn(), replace: vi.fn() },
  searchParams: new URLSearchParams(),
};

type Row = { id: string; name: string };
type Raw = { rows: Row[]; count: number };

const rows: Row[] = [
  { id: "widget_1", name: "First widget" },
  { id: "widget_2", name: "Second widget" },
];

function SelectRows() {
  const { dataView } = useResource<Row>();

  React.useEffect(() => {
    dataView.onRowSelectionChange?.({ widget_1: true, widget_2: true });
  }, [dataView.onRowSelectionChange]);

  return null;
}

function renderBulkFixture(deleteMany: ReturnType<typeof vi.fn>) {
  const resource = defineResource<Row, never, never, Raw>({
    metadata: {
      name: "widgets",
      label: "Widgets",
      singularLabel: "Widget",
    },
    query: {
      queryKey: () => ["widgets"],
      queryFn: async () => ({ rows, count: rows.length }),
      normalize: (response) =>
        normalizeResourceList(response.rows, response.count),
    },
    mutations: {
      deleteMany: {
        mutationFn: deleteMany,
        getInput: (selected) => selected.map((row) => row.id),
      },
    },
    dataView: {
      columns: [{ accessorKey: "name", header: "Name" }],
      getRowId: (row) => row.id,
      urlState: { defaults: { page: 1, pageSize: 10 } },
    },
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ResourceExecutionContextProvider value={{ storeId: "store_a" }}>
        <TestNavigationProvider navigation={navigation}>
          <ResourceProvider
            definition={resource}
            initialData={{ rows, count: rows.length }}
          >
            <SelectRows />
            <ResourceBulkActionBar />
          </ResourceProvider>
        </TestNavigationProvider>
      </ResourceExecutionContextProvider>
    </QueryClientProvider>
  );
}

describe("Resource bulk delete confirmation", () => {
  it("waits for confirmation and clears selection only after successful deletion", async () => {
    const user = userEvent.setup();
    const deleteMany = vi
      .fn()
      .mockResolvedValue({ ids: rows.map((row) => row.id) });
    renderBulkFixture(deleteMany);

    expect(await screen.findByText("2 selected")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.getByRole("alertdialog")).toBeTruthy();
    expect(screen.getByText("Delete 2 widgets?")).toBeTruthy();
    expect(deleteMany).not.toHaveBeenCalled();

    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Cancel",
      })
    );
    expect(deleteMany).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Delete",
      })
    );

    await waitFor(() =>
      expect(deleteMany).toHaveBeenCalledWith(
        ["widget_1", "widget_2"],
        expect.objectContaining({
          mutationKey: [
            "store",
            "store_a",
            "resource",
            "widgets",
            "deleteMany",
          ],
        })
      )
    );
    await waitFor(() => expect(screen.queryByText("2 selected")).toBeNull());
  });

  it("keeps the dialog and selection when bulk deletion fails", async () => {
    const user = userEvent.setup();
    const deleteMany = vi.fn().mockRejectedValue(new Error("Delete failed"));
    renderBulkFixture(deleteMany);

    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Delete",
      })
    );

    await waitFor(() => expect(deleteMany).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    expect(screen.getByText("2 selected")).toBeTruthy();
  });
});
