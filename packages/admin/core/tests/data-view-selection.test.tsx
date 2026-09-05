import * as React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDataViewUrlState } from "../src/data-view/url-state";
import { getDataViewTableState } from "../src/data-view/state";
import {
  createDataViewState,
  getDataViewViewState,
} from "../src/data-view/state";
import { AdminNavigationProvider } from "../src/navigation";
import { createResourceTestEnvironment } from "../src/testing";

const navigation = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
};
const location = { pathname: "/widgets", searchParams: new URLSearchParams() };
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AdminNavigationProvider navigation={navigation} location={location}>
    {children}
  </AdminNavigationProvider>
);

const filters = [
  { id: "status", label: "Status", type: "single-select" as const },
];

describe("DataView selection semantics", () => {
  it("keeps common state and view-specific state in separate serializable namespaces", () => {
    const state = createDataViewState({
      search: " shoes ",
      activeView: "grid",
      viewState: {
        grid: { density: "comfortable" },
        table: {
          pagination: { pageIndex: 2, pageSize: 50 },
        } as never,
      },
    });

    expect(state).toMatchObject({
      search: "shoes",
      activeView: "grid",
      viewState: { grid: { density: "comfortable" } },
    });
    expect(getDataViewTableState(state).pagination).toEqual({
      pageIndex: 2,
      pageSize: 50,
    });
    expect(getDataViewViewState(state, "grid")).toEqual({
      density: "comfortable",
    });
  });

  it("fails explicitly when no navigation provider is installed", () => {
    expect(() => renderHook(() => useDataViewUrlState())).toThrow(
      "Admin navigation is unavailable"
    );
  });

  it("uses page-local explicit selection by default and preserves it when opted in", () => {
    const local = renderHook(
      () =>
        useDataViewUrlState({ filters, selectionScopeKey: "widgets:store_a" }),
      { wrapper }
    );

    act(() => local.result.current.setSelectedIds(["b", "a"]));
    expect(local.result.current.selection.executeIds).toEqual(["a", "b"]);

    act(() =>
      local.result.current.setPagination({ pageIndex: 1, pageSize: 20 })
    );
    expect(local.result.current.selection.selectedIds).toEqual([]);

    const crossPage = renderHook(
      () =>
        useDataViewUrlState({
          preserveSelectionAcrossPages: true,
          selectionScopeKey: "widgets:store_a",
        }),
      { wrapper }
    );
    act(() => crossPage.result.current.setSelectedIds(["a"]));
    act(() =>
      crossPage.result.current.setPagination({ pageIndex: 1, pageSize: 20 })
    );
    expect(crossPage.result.current.selection.executeIds).toEqual(["a"]);
  });

  it("clears hidden selections for search/filter changes and resource scope switches", async () => {
    const hook = renderHook(
      ({ scope }: { scope: string }) =>
        useDataViewUrlState({
          filters,
          selectionScopeKey: scope,
          preserveSelectionAcrossPages: true,
        }),
      { initialProps: { scope: "widgets:store_a" }, wrapper }
    );

    act(() => hook.result.current.setSelectedIds(["a"]));
    act(() => hook.result.current.setFilter("status", "active"));
    expect(hook.result.current.selection.selectedIds).toEqual([]);

    act(() => hook.result.current.setSelectedIds(["a"]));
    act(() => hook.result.current.commitSearch("shoes"));
    expect(hook.result.current.selection.selectedIds).toEqual([]);

    act(() => hook.result.current.setSelectedIds(["a"]));
    hook.rerender({ scope: "widgets:store_b" });
    await waitFor(() =>
      expect(hook.result.current.selection.selectedIds).toEqual([])
    );
  });

  it("uses the generic adapter for URL state and browser history", () => {
    const environment = createResourceTestEnvironment({
      pathname: "/widgets",
      searchParams: new URLSearchParams("q=shoes&page=2"),
    });
    const hook = renderHook(
      () => useDataViewUrlState({ defaults: { pageSize: 20 } }),
      { wrapper: environment.wrapper }
    );

    expect(hook.result.current.state.search).toBe("shoes");
    expect(getDataViewTableState(hook.result.current.state).pagination.pageIndex).toBe(1);

    act(() =>
      hook.result.current.setPagination({ pageIndex: 2, pageSize: 20 })
    );
    expect(environment.navigation.pushes).toEqual([
      "/widgets?q=shoes&page=3&pageSize=20",
    ]);
    expect(environment.navigation.history).toEqual([
      "/widgets?q=shoes&page=2",
      "/widgets?q=shoes&page=3&pageSize=20",
    ]);

    act(() => environment.navigation.back());
    expect(environment.navigation.pathname).toBe("/widgets");
    expect(environment.navigation.searchParams.get("page")).toBe("2");
    expect(getDataViewTableState(hook.result.current.state).pagination.pageIndex).toBe(1);
    expect(environment.navigation.backCalls).toBe(1);
  });

  it("preserves DataView URL parsing and serialization through the adapter", () => {
    const environment = createResourceTestEnvironment({
      pathname: "/widgets",
      searchParams: new URLSearchParams(
        "q=shirt&page=2&pageSize=50&sort=-name&status=active"
      ),
    });
    const hook = renderHook(
      () =>
        useDataViewUrlState({
          filters,
          allowedPageSizes: [20, 50],
          allowedSortIds: ["name"],
        }),
      { wrapper: environment.wrapper }
    );

    expect(hook.result.current.state).toMatchObject({
      search: "shirt",
      filters: { status: "active" },
      sorting: [{ id: "name", desc: true }],
      viewState: {
        table: {
          pagination: { pageIndex: 1, pageSize: 50 },
        },
      },
    });

    act(() => hook.result.current.setFilter("status", "draft"));
    expect(environment.navigation.replaces.at(-1)).toBe(
      "/widgets?q=shirt&page=1&pageSize=50&sort=-name&status=draft"
    );
    act(() => hook.result.current.setSorting([{ id: "name", desc: false }]));
    expect(environment.navigation.replaces.at(-1)).toBe(
      "/widgets?q=shirt&page=1&pageSize=50&sort=name&status=draft"
    );
  });

  it("parses active views, preserves namespaced state, and normalizes invalid IDs", async () => {
    const environment = createResourceTestEnvironment({
      pathname: "/widgets",
      searchParams: new URLSearchParams(
        "view=missing&view.grid.density=comfortable&unknown=kept"
      ),
    });
    const hook = renderHook(
      () =>
        useDataViewUrlState({
          views: [
            { id: "grid", type: "grid", default: true },
            { id: "table", type: "table" },
          ],
        }),
      { wrapper: environment.wrapper }
    );

    expect(hook.result.current.state.activeView).toBe("grid");
    expect(hook.result.current.state.viewState.grid).toEqual({
      density: "comfortable",
    });
    await waitFor(() =>
      expect(environment.navigation.replaces.at(-1)).toBe(
        "/widgets?view=grid&view.grid.density=comfortable&unknown=kept"
      )
    );

    act(() => hook.result.current.setActiveView("table"));
    expect(environment.navigation.pushes.at(-1)).toBe(
      "/widgets?view=table&view.grid.density=comfortable&unknown=kept"
    );
  });

  it("round-trips typed view state and separates replace from patch semantics", () => {
    const environment = createResourceTestEnvironment({
      pathname: "/widgets",
      searchParams: new URLSearchParams(
        "q=kept&unknown=kept&view=calendar&view.calendar.stale=old&view.calendar.other=%22keep%22&view.grid.density=%22comfortable%22"
      ),
    });
    const hook = renderHook(
      () =>
        useDataViewUrlState({
          views: [
            { id: "calendar", type: "calendar", default: true },
            { id: "grid", type: "grid" },
          ],
        }),
      { wrapper: environment.wrapper }
    );

    const values = {
      stringBoolean: "true",
      stringNumber: "123",
      stringNull: "null",
      month: "month",
      boolean: true,
      number: 123,
      nullValue: null,
      array: ["a", "b"],
      object: { foo: "bar" },
      empty: "",
    };
    act(() => hook.result.current.setViewState("calendar", values));

    expect(environment.navigation.pushes.at(-1)).toContain(
      "q=kept&unknown=kept"
    );
    expect(environment.navigation.pushes.at(-1)).not.toContain(
      "view.calendar.stale"
    );
    expect(hook.result.current.state.viewState.calendar).toEqual(values);

    act(() =>
      hook.result.current.patchViewState("calendar", {
        month: "week",
        object: undefined,
      })
    );
    expect(hook.result.current.state.viewState.calendar!).toMatchObject({
      stringBoolean: "true",
      stringNumber: "123",
      stringNull: "null",
      month: "week",
      boolean: true,
      number: 123,
      nullValue: null,
      array: ["a", "b"],
      empty: "",
    });
    expect(hook.result.current.state.viewState.calendar!.object).toBeUndefined();
    expect(environment.navigation.pushes.at(-1)).toContain(
      "view.grid.density=%22comfortable%22"
    );
  });

  it("keeps legacy raw namespaced strings as strings", () => {
    const environment = createResourceTestEnvironment({
      searchParams: new URLSearchParams("view=calendar&view.calendar.mode=month"),
    });
    const hook = renderHook(
      () =>
        useDataViewUrlState({
          views: [{ id: "calendar", type: "calendar", default: true }],
        }),
      { wrapper: environment.wrapper }
    );

    expect(hook.result.current.state.viewState.calendar!.mode).toBe("month");
  });

  it("normalizes an unauthorized requested view before the Resource query state is exposed", async () => {
    const environment = createResourceTestEnvironment({
      pathname: "/widgets",
      searchParams: new URLSearchParams("view=grid&unknown=kept"),
    });
    const hook = renderHook(
      () =>
        useDataViewUrlState({
          views: [
            { id: "grid", type: "grid", default: true },
            { id: "table", type: "table" },
          ],
          viewAuthorization: {
            status: "ready",
            allowedViewIds: ["table"],
          },
        }),
      { wrapper: environment.wrapper }
    );

    expect(hook.result.current.state.activeView).toBe("table");
    await waitFor(() =>
      expect(environment.navigation.replaces.at(-1)).toBe(
        "/widgets?view=table&unknown=kept"
      )
    );
  });
});
