import { describe, expect, it } from "vitest";
import {
  createDataViewState,
  normalizeDataViewState,
  normalizeResourceList,
  createResourceSelection,
  getDataViewTableState,
  resolveResourceSelectionExecution,
  resolveResourceBulkActions,
  resolveResourceCapabilities,
  resolveResourcePagination,
  resolveResourceRowActions,
  resolveResourceViews,
  defineResource,
  createResourceAuthorization,
  resolveAuthorizedResourceViews,
  defaultInitialDataPredicate,
} from "../src";

type Row = { id: string; name: string };

const definition = defineResource<Row>({
  metadata: {
    name: "widgets",
    label: "Widgets",
    singularLabel: "Widget",
    pluralLabel: "Widgets",
  },
  dataView: {
    columns: [],
    getRowId: (row) => row.id,
  },
  forms: {
    create: { schema: () => undefined, fields: [] },
    update: { schema: () => undefined, fields: [] },
  },
  mutations: {
    create: { mutationFn: async () => undefined },
    update: {
      mutationFn: async () => undefined,
      getInput: ({ record, values }) => ({ record, values }),
    },
    delete: { mutationFn: async () => undefined, getInput: (row) => row.id },
  },
  bulkDelete: { strategy: "individual" },
});

describe("admin-core contracts", () => {
  it("keeps list normalization at the resource boundary", () => {
    expect(normalizeResourceList<Row>(undefined, undefined)).toEqual({
      rows: [],
      count: 0,
    });
    expect(normalizeResourceList([{ id: "1", name: "One" }], 4)).toEqual({
      rows: [{ id: "1", name: "One" }],
      count: 4,
    });
  });

  it("preserves capability and pagination defaults", () => {
    const capabilities = resolveResourceCapabilities(definition);
    expect(capabilities).toMatchObject({
      create: true,
      update: true,
      delete: true,
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

  it("normalizes canonical DataView state for query consumers", () => {
    const state = createDataViewState({
      search: "  shoes ",
      filters: { status: ["active", "active", "draft"] },
      pagination: { pageIndex: -2, pageSize: 0 },
      sorting: [
        { id: "name", desc: true },
        { id: "ignored", desc: false },
      ],
    });
    expect(state.search).toBe("shoes");
    expect(state.filters.status).toEqual(["active", "draft"]);
    expect(getDataViewTableState(state).pagination).toEqual({
      pageIndex: 0,
      pageSize: 1,
    });
    expect(state.sorting).toEqual([{ id: "name", desc: true }]);
    expect(normalizeDataViewState(state)).toEqual(state);
  });

  it("preserves implicit and explicit Resource view defaults and rejects invalid IDs", () => {
    expect(resolveResourceViews()).toEqual([
      { id: "table", type: "table", default: true },
    ]);
    expect(
      resolveResourceViews([
        { id: "tree", type: "tree" },
        { id: "table", type: "table" },
      ])
    ).toEqual([
      { id: "tree", type: "tree", default: true },
      { id: "table", type: "table" },
    ]);
    expect(() =>
      resolveResourceViews([
        { id: "table", type: "table" },
        { id: "table", type: "grid" },
      ])
    ).toThrow('Duplicate Resource view id "table".');
    expect(() => resolveResourceViews([{ id: "  ", type: "table" }])).toThrow(
      "must have a non-empty id"
    );
  });

  it("resolves the authorized Resource view before renderer concerns", () => {
    const resource = defineResource({
      ...definition,
      authorization: { read: "widgets.read" },
      views: [
        { id: "grid", type: "grid", permission: "widgets.grid" },
        { id: "table", type: "table", default: true },
      ],
    });
    const authorization = createResourceAuthorization({
      permissions: ["widgets.read"],
    });
    expect(
      resolveAuthorizedResourceViews(resource, "grid", authorization)
    ).toMatchObject({
      ready: true,
      view: { id: "table", type: "table" },
      views: [{ id: "table", type: "table", default: true }],
    });
    expect(
      resolveAuthorizedResourceViews(
        resource,
        "grid",
        createResourceAuthorization({ status: "loading" })
      )
    ).toMatchObject({
      ready: false, view: null, views: [], deniedViews: [],
      unresolvedViews: resource.views,
    });
  });

  it.each(["loading", "unavailable", "error"] as const)(
    "resolves public views while permissioned views are unresolved (%s)",
    (status) => {
      const views = [
        { id: "table", type: "table", default: true },
        { id: "finance", type: "grid", permission: "finance.read" },
      ];
      const result = resolveAuthorizedResourceViews(
        { views },
        "finance",
        createResourceAuthorization({ status })
      );
      expect(result).toEqual({
        view: views[0], views: [views[0]], deniedViews: [],
        unresolvedViews: [views[1]], ready: false,
      });
    }
  );

  it("distinguishes ready denial from unresolved access and preserves fallback order", () => {
    const views = [
      { id: "finance", type: "grid", default: true, permission: "finance.read" },
      { id: "table", type: "table" },
      { id: "summary", type: "summary" },
    ];
    const denied = createResourceAuthorization();
    expect(
      resolveAuthorizedResourceViews({ views }, "finance", denied)
    ).toMatchObject({
      view: { id: "table" }, ready: true,
      deniedViews: [views[0]], unresolvedViews: [],
    });
    expect(
      resolveAuthorizedResourceViews({ views }, "summary", denied).view?.id
    ).toBe("summary");
    expect(resolveAuthorizedResourceViews(
      { views }, "finance",
      createResourceAuthorization({ permissions: ["finance.read"] })
    ).view?.id).toBe("finance");
    expect(resolveAuthorizedResourceViews(
      { views: [views[0]!] }, "finance", denied
    )).toMatchObject({
      view: null, ready: true, views: [],
      deniedViews: [views[0]], unresolvedViews: [],
    });
    expect(resolveAuthorizedResourceViews(
      { views: [views[0]!] }, "finance", undefined
    )).toMatchObject({
      view: null, ready: false, views: [],
      deniedViews: [], unresolvedViews: [views[0]],
    });
  });

  it("accepts default initial data only for the built-in Table view", () => {
    const tableState = createDataViewState();
    const context = (type: string) => ({
      state: tableState,
      view: {
        id: type,
        type,
        config: {},
        state: {},
      },
    });

    expect(defaultInitialDataPredicate(definition, context("table"))).toBe(
      true
    );
    expect(defaultInitialDataPredicate(definition, context("grid"))).toBe(
      false
    );
  });

  it("keeps explicit selection IDs stable and separates partial execution outcomes", () => {
    const selection = createResourceSelection({
      widget_2: true,
      widget_1: true,
    });
    expect(selection).toEqual({
      mode: "explicit",
      selectedIds: ["widget_1", "widget_2"],
      executeIds: ["widget_1", "widget_2"],
    });
    expect(
      resolveResourceSelectionExecution(
        {
          ids: ["widget_1"],
          requestedIds: ["widget_1", "widget_2"],
          failures: [{ id: "widget_2", message: "failed" }],
        },
        selection.executeIds
      )
    ).toEqual({
      successIds: ["widget_1"],
      failedIds: ["widget_2"],
    });
  });
});
