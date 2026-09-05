import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  defineResource,
  useResource,
} from "@eng-mohamedelsayed/admin-core/resource";
import { createResourceTestEnvironment } from "@eng-mohamedelsayed/admin-core/testing";
import {
  DataViewContext,
  DataViewSwitcher,
  ResourceDataView,
  ResourceViewRuntime,
} from "../src/components/resource";

describe("DataView switcher recovery", () => {
  it.each(["click", "keyboard"])(
    "recovers a missing renderer through a manual %s",
    async (input) => {
      const user = userEvent.setup();
      const environment = createResourceTestEnvironment({
        storeId: "store_a",
        searchParams: new URLSearchParams("q=kept&unknown=kept"),
      });
      const queryFn = vi.fn(async () => ({
        rows: [{ id: "1", name: "Widget" }],
        count: 1,
      }));
      const resource = defineResource<{ id: string; name: string }>({
        metadata: {
          name: "recovery",
          label: "Recovery",
          singularLabel: "Recovery",
        },
        views: [
          { id: "calendar", type: "calendar", default: true },
          { id: "table", type: "table" },
        ],
        query: {
          queryKey: () => ["recovery"],
          queryFn,
          normalize: (raw) => raw,
        },
        dataView: {
          columns: [{ accessorKey: "name", header: "Name" }],
          getRowId: (row) => row.id,
        },
      });
      function Probe() {
        const { dataView } = useResource();
        return (
          <output data-testid="effective-view">{dataView.view?.id}</output>
        );
      }
      render(
        <environment.Resource definition={resource}>
          <ResourceViewRuntime>
            <DataViewSwitcher />
            <ResourceDataView />
            <Probe />
          </ResourceViewRuntime>
        </environment.Resource>
      );
      expect(screen.getByText("View unavailable")).toBeTruthy();
      expect(screen.getByTestId("effective-view").textContent).toBe("calendar");
      const table = screen.getByRole("tab", { name: "Table" });
      expect(table.tabIndex).toBe(0);
      expect(table.getAttribute("aria-selected")).toBe("false");
      await user.tab();
      expect(document.activeElement).toBe(table);
      expect(environment.navigation.pushes).toEqual([]);
      expect(environment.navigation.replaces).toEqual([]);
      if (input === "click") await user.click(table);
      else await user.keyboard("{Enter}");
      await waitFor(() =>
        expect(screen.getByTestId("effective-view").textContent).toBe("table")
      );
      expect(environment.navigation.pushes).toEqual([
        "/resource?q=kept&unknown=kept&view=table",
      ]);
      expect(screen.queryByText("View unavailable")).toBeNull();
    }
  );

  it.each([
    { viewList: [] },
    { viewList: [{ id: "table", label: "Table", capabilities: {} }] },
  ])("hides when there is no useful selection (%j)", ({ viewList }) => {
    const setActiveView = vi.fn();
    render(
      <DataViewContext.Provider
        value={{
          views: Object.fromEntries(viewList.map((view) => [view.id, view])),
          viewList,
          activeView: "table",
          activeViewDefinition: viewList[0],
          activeCapabilities: {},
          setActiveView,
        }}
      >
        <DataViewSwitcher />
      </DataViewContext.Provider>
    );
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(setActiveView).not.toHaveBeenCalled();
  });

  it("uses only the first alternative as the tab stop and calls the canonical setter", async () => {
    const user = userEvent.setup();
    const setActiveView = vi.fn();
    const viewList = [
      { id: "table", label: "Table", capabilities: {} },
      { id: "grid", label: "Grid", capabilities: {} },
    ];
    render(
      <DataViewContext.Provider
        value={{
          views: {},
          viewList,
          activeView: "missing",
          activeViewDefinition: undefined,
          activeCapabilities: {},
          setActiveView,
        }}
      >
        <DataViewSwitcher />
      </DataViewContext.Provider>
    );
    expect(screen.getByRole("tab", { name: "Table" }).tabIndex).toBe(0);
    expect(screen.getByRole("tab", { name: "Grid" }).tabIndex).toBe(-1);
    await user.click(screen.getByRole("tab", { name: "Table" }));
    expect(setActiveView).toHaveBeenCalledExactlyOnceWith("table");
  });
});
