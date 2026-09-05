"use client";

import * as React from "react";
import type {
  ColumnOrderState,
  ExpandedState,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  createDataViewState,
  normalizeDataViewFilterValue,
  resolveResourceView,
  resolveResourceViews,
} from "./state";
import { createResourceSelection } from "./state";
import type {
  DataViewFilterDefinition,
  DataViewFilterValue,
  DataViewState,
  DataViewViewState,
  JsonValue,
  ResourceViewDefinition,
  ResourceSelection,
} from "./contracts";
import { useAdminLocation, useAdminNavigation } from "../navigation";

export interface UseDataViewUrlStateOptions {
  defaults?: {
    page?: number;
    pageSize?: number;
    sorting?: SortingState;
    filters?: Record<string, DataViewFilterValue>;
    columnVisibility?: VisibilityState;
    columnOrder?: ColumnOrderState;
    activeView?: string;
    viewState?: DataViewState["viewState"];
  };
  filters?: readonly DataViewFilterDefinition[];
  views?: readonly ResourceViewDefinition[];
  allowedPageSizes?: readonly number[];
  allowedSortIds?: readonly string[];
  searchDebounceMs?: number;
  persistenceKey?: string;
  /** Explicit cross-page selection is opt-in. */
  preserveSelectionAcrossPages?: boolean;
  /** Resets ephemeral selection when a Resource or Store boundary changes. */
  selectionScopeKey?: string;
  /** Core authorization snapshot. Pending snapshots can still contain public views. */
  viewAuthorization?: {
    status: "pending" | "ready" | "unavailable";
    allowedViewIds: readonly string[];
  };
}

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function rangeParts(value: string): { from?: string; to?: string } {
  const separator = value.indexOf("..");
  if (separator < 0) return value ? { from: value } : {};
  const from = value.slice(0, separator);
  const to = value.slice(separator + 2);
  return { ...(from ? { from } : {}), ...(to ? { to } : {}) };
}

function parseFilter(
  definition: DataViewFilterDefinition,
  value: string | null
): DataViewFilterValue | undefined {
  if (value === null || value === "") return undefined;
  switch (definition.type) {
    case "multi-select":
      return normalizeDataViewFilterValue(value.split(","));
    case "boolean":
      return value === "true" ? true : value === "false" ? false : undefined;
    case "number": {
      const number = Number(value);
      return Number.isFinite(number) ? number : undefined;
    }
    case "number-range": {
      const range = rangeParts(value);
      const from = range.from === undefined ? undefined : Number(range.from);
      const to = range.to === undefined ? undefined : Number(range.to);
      return normalizeDataViewFilterValue({
        ...(from !== undefined && Number.isFinite(from) ? { from } : {}),
        ...(to !== undefined && Number.isFinite(to) ? { to } : {}),
      });
    }
    case "date-range":
      return normalizeDataViewFilterValue(rangeParts(value));
    default:
      return normalizeDataViewFilterValue(value);
  }
}

function serializeFilter(value: DataViewFilterValue | undefined) {
  const normalized = normalizeDataViewFilterValue(value);
  if (normalized === undefined) return null;
  if (Array.isArray(normalized)) return normalized.join(",");
  if (typeof normalized === "object" && normalized !== null) {
    return `${normalized.from ?? ""}..${normalized.to ?? ""}`;
  }
  return String(normalized);
}

function parseViewState(searchParams: URLSearchParams) {
  const result: Record<string, DataViewViewState> = {};
  for (const [key, value] of searchParams.entries()) {
    if (!key.startsWith("view.") || key === "view") continue;
    const namespace = key.slice("view.".length);
    const separator = namespace.indexOf(".");
    const viewId = separator >= 0 ? namespace.slice(0, separator) : "";
    const stateKey = separator >= 0 ? namespace.slice(separator + 1) : "";
    if (!viewId || !stateKey) continue;
    let parsed: JsonValue = value;
    try {
      parsed = JSON.parse(value) as JsonValue;
    } catch {
      // Primitive legacy-compatible values remain strings.
    }
    result[viewId] = { ...(result[viewId] ?? {}), [stateKey]: parsed };
  }
  return result;
}

function serializeViewStateValue(value: JsonValue) {
  return JSON.stringify(value);
}

export function useDataViewUrlState(options: UseDataViewUrlStateOptions = {}) {
  const navigation = useAdminNavigation();
  const { pathname, searchParams } = useAdminLocation();
  const defaults = options.defaults ?? {};
  const defaultPage = Math.max(1, defaults.page ?? 1);
  const defaultPageSize = Math.max(1, defaults.pageSize ?? 20);
  const allowedPageSizes = options.allowedPageSizes ?? [10, 20, 30, 50, 100];
  const debounceMs = Math.max(0, options.searchDebounceMs ?? 300);
  const committedSearch = searchParams.get("q")?.trim() ?? "";
  const resourceViews = React.useMemo(
    () => resolveResourceViews(options.views),
    [options.views]
  );
  const defaultView = resolveResourceView(
    options.views,
    defaults.activeView
  );
  const requestedView = searchParams.get("view");
  const requestedOrDefaultView = resolveResourceView(
    options.views,
    requestedView ?? defaultView.id
  );
  const activeView = React.useMemo(() => {
    const viewAuthorization = options.viewAuthorization;
    if (!viewAuthorization || viewAuthorization.status === "pending") {
      return requestedOrDefaultView;
    }
    const allowed = resourceViews.filter((view) =>
      viewAuthorization.allowedViewIds.includes(view.id)
    );
    if (allowed.length === 0) return null;
    return (
      allowed.find((view) => view.id === requestedView) ??
      allowed.find((view) => view.id === defaultView.id) ??
      allowed.find((view) => view.default) ??
      allowed[0]
    );
  }, [
    defaultView.id,
    options.viewAuthorization,
    requestedOrDefaultView,
    requestedView,
    resourceViews,
  ]);
  const [searchInput, setSearchInput] = React.useState(committedSearch);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(defaults.columnVisibility ?? {});
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>(
    defaults.columnOrder ?? []
  );
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const persistedKeyHydratedRef = React.useRef<string | null>(null);
  const previousSelectionScopeKeyRef = React.useRef(options.selectionScopeKey);

  const clearSelection = React.useCallback(() => setRowSelection({}), []);

  const updateUrl = React.useCallback(
    (
      params: Record<string, string | number | null | undefined>,
      history: "push" | "replace" = "replace"
    ) => {
      const current = new URLSearchParams(
        Array.from(searchParams.entries()) as Array<[string, string]>
      );
      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "")
          current.delete(key);
        else current.set(key, String(value));
      });
      const search = current.toString();
      navigation[history](search ? `${pathname}?${search}` : pathname, {
        scroll: false,
      });
    },
    [navigation, pathname, searchParams]
  );

  React.useEffect(() => setSearchInput(committedSearch), [committedSearch]);
  React.useEffect(() => {
    if (searchInput.trim() === committedSearch) return;
    const timeout = window.setTimeout(() => {
      clearSelection();
      updateUrl({ q: searchInput.trim() || null, page: 1 });
    }, debounceMs);
    return () => window.clearTimeout(timeout);
  }, [clearSelection, committedSearch, debounceMs, searchInput, updateUrl]);

  React.useEffect(() => {
    if (previousSelectionScopeKeyRef.current === options.selectionScopeKey) {
      return;
    }
    previousSelectionScopeKeyRef.current = options.selectionScopeKey;
    clearSelection();
  }, [clearSelection, options.selectionScopeKey]);

  React.useEffect(() => {
    const persistenceKey = options.persistenceKey;
    if (!persistenceKey) {
      persistedKeyHydratedRef.current = null;
      return;
    }
    persistedKeyHydratedRef.current = null;
    let hydrationTimer: number | undefined;
    try {
      const persisted = window.localStorage.getItem(persistenceKey);
      if (persisted) {
        const parsed = JSON.parse(persisted) as {
          columnVisibility?: VisibilityState;
          columnOrder?: ColumnOrderState;
        };
        hydrationTimer = window.setTimeout(() => {
          if (parsed.columnVisibility)
            setColumnVisibility(parsed.columnVisibility);
          if (parsed.columnOrder) setColumnOrder(parsed.columnOrder);
          persistedKeyHydratedRef.current = persistenceKey;
        }, 0);
      } else persistedKeyHydratedRef.current = persistenceKey;
    } catch {
      persistedKeyHydratedRef.current = persistenceKey;
    }
    return () => {
      if (hydrationTimer !== undefined) window.clearTimeout(hydrationTimer);
    };
  }, [options.persistenceKey]);

  React.useEffect(() => {
    if (
      !options.persistenceKey ||
      persistedKeyHydratedRef.current !== options.persistenceKey
    )
      return;
    window.localStorage.setItem(
      options.persistenceKey,
      JSON.stringify({ columnVisibility, columnOrder })
    );
  }, [columnOrder, columnVisibility, options.persistenceKey]);

  const pageSizeFromUrl = positiveInteger(
    searchParams.get("pageSize"),
    defaultPageSize
  );
  const pageSize = allowedPageSizes.includes(pageSizeFromUrl)
    ? pageSizeFromUrl
    : defaultPageSize;
  const pagination = React.useMemo<PaginationState>(
    () => ({
      pageIndex: positiveInteger(searchParams.get("page"), defaultPage) - 1,
      pageSize,
    }),
    [defaultPage, pageSize, searchParams]
  );
  const sort = searchParams.get("sort") ?? "";
  const sorting = React.useMemo<SortingState>(() => {
    if (!sort) return defaults.sorting ?? [];
    const desc = sort.startsWith("-");
    const id = desc ? sort.slice(1) : sort;
    if (
      !id ||
      (options.allowedSortIds && !options.allowedSortIds.includes(id))
    ) {
      return defaults.sorting ?? [];
    }
    return [{ id, desc }];
  }, [defaults.sorting, options.allowedSortIds, sort]);
  const filters = React.useMemo(() => {
    const entries = (options.filters ?? []).flatMap((definition) => {
      const value = parseFilter(
        definition,
        searchParams.get(definition.parameter ?? definition.id)
      );
      return value === undefined ? [] : [[definition.id, value] as const];
    });
    return { ...(defaults.filters ?? {}), ...Object.fromEntries(entries) };
  }, [defaults.filters, options.filters, searchParams]);
  const urlViewState = React.useMemo(
    () => parseViewState(searchParams),
    [searchParams]
  );

  React.useEffect(() => {
    // Resources with explicit views normalize invalid IDs. The implicit Table
    // fallback intentionally leaves legacy URLs byte-for-byte compatible.
    if (!options.views?.length || !requestedView) return;
    if (options.viewAuthorization?.status === "pending") return;
    if (!activeView) {
      updateUrl({ view: null }, "replace");
      return;
    }
    if (
      requestedView !== activeView.id &&
      (!resourceViews.some((view) => view.id === requestedView) ||
        !options.viewAuthorization?.allowedViewIds.includes(requestedView))
    ) {
      updateUrl({ view: activeView.id }, "replace");
    }
  }, [
    activeView?.id,
    options.viewAuthorization,
    options.views,
    requestedView,
    resourceViews,
    updateUrl,
  ]);
  const previousSelectionQueryRef = React.useRef<string | null>(null);
  const preserveSelectionOnNextQueryChangeRef = React.useRef(false);
  React.useEffect(() => {
    const querySignature = JSON.stringify({
      search: committedSearch,
      filters,
      // Page changes are scope changes for page-local selection. Explicit
      // cross-page selection intentionally survives them.
      ...(options.preserveSelectionAcrossPages !== true
        ? { page: pagination.pageIndex, pageSize: pagination.pageSize }
        : {}),
    });
    if (previousSelectionQueryRef.current === null) {
      previousSelectionQueryRef.current = querySignature;
      return;
    }
    if (previousSelectionQueryRef.current !== querySignature) {
      previousSelectionQueryRef.current = querySignature;
      if (preserveSelectionOnNextQueryChangeRef.current) {
        preserveSelectionOnNextQueryChangeRef.current = false;
        return;
      }
      clearSelection();
    }
  }, [
    clearSelection,
    committedSearch,
    filters,
    options.preserveSelectionAcrossPages,
    pagination.pageIndex,
    pagination.pageSize,
  ]);
  const state = React.useMemo<DataViewState>(
    () =>
      createDataViewState({
        search: committedSearch,
        filters,
        pagination,
        sorting,
        activeView: activeView?.id ?? requestedOrDefaultView.id,
        viewState: {
          ...(defaults.viewState ?? {}),
          ...urlViewState,
          table: {
            ...(defaults.viewState?.table ?? {}),
            ...(urlViewState.table ?? {}),
            pagination,
            columnVisibility,
            columnOrder,
            rowSelection,
            expanded,
          } as unknown as DataViewViewState,
        },
      }),
    [
      columnOrder,
      columnVisibility,
      committedSearch,
      expanded,
      filters,
      pagination,
      rowSelection,
      sorting,
      activeView?.id,
      defaults.viewState,
      requestedOrDefaultView.id,
      urlViewState,
    ]
  );

  const setActiveView = React.useCallback(
    (viewId: string, history: "push" | "replace" = "push") => {
      if (!resourceViews.some((view) => view.id === viewId)) return;
      if (
        options.viewAuthorization &&
        !options.viewAuthorization.allowedViewIds.includes(viewId)
      ) {
        return;
      }
      if (viewId === defaultView.id) {
        updateUrl({ view: null }, history);
      } else {
        updateUrl({ view: viewId }, history);
      }
    },
    [
      defaultView.id,
      options.viewAuthorization,
      resourceViews,
      updateUrl,
    ]
  );

  const updateViewNamespace = React.useCallback(
    (
      viewId: string,
      next: Record<string, JsonValue>,
      history: "push" | "replace" = "push"
    ) => {
      const current = new URLSearchParams(
        Array.from(searchParams.entries()) as Array<[string, string]>
      );
      const prefix = `view.${viewId}.`;
      for (const key of Array.from(current.keys())) {
        if (key.startsWith(prefix)) current.delete(key);
      }
      for (const [key, value] of Object.entries(next)) {
        current.set(`${prefix}${key}`, serializeViewStateValue(value));
      }
      const search = current.toString();
      navigation[history](search ? `${pathname}?${search}` : pathname, {
        scroll: false,
      });
    },
    [navigation, pathname, searchParams]
  );

  const setViewState = React.useCallback(
    (viewId: string, next: Record<string, JsonValue>) => {
      updateViewNamespace(viewId, next, "push");
    },
    [updateViewNamespace]
  );

  const patchViewState = React.useCallback(
    (
      viewId: string,
      patch: Record<string, JsonValue | undefined>
    ) => {
      const current = urlViewState[viewId] ?? {};
      const next: Record<string, JsonValue> = { ...current };
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined) delete next[key];
        else next[key] = value;
      }
      updateViewNamespace(viewId, next, "push");
    },
    [updateViewNamespace, urlViewState]
  );

  const setPagination = React.useCallback(
    (next: PaginationState) => {
      const pageSizeChanged = next.pageSize !== pagination.pageSize;
      const pageChanged = next.pageIndex !== pagination.pageIndex;
      if (
        (pageChanged || pageSizeChanged) &&
        options.preserveSelectionAcrossPages !== true
      ) {
        clearSelection();
      }
      updateUrl(
        {
          page: pageSizeChanged ? 1 : next.pageIndex + 1,
          pageSize: next.pageSize,
        },
        "push"
      );
    },
    [
      clearSelection,
      options.preserveSelectionAcrossPages,
      pagination.pageIndex,
      pagination.pageSize,
      updateUrl,
    ]
  );
  const setSorting = React.useCallback(
    (next: SortingState) => {
      const first = next[0];
      if (pagination.pageIndex !== 0) {
        preserveSelectionOnNextQueryChangeRef.current = true;
      }
      updateUrl({
        sort: first ? `${first.desc ? "-" : ""}${first.id}` : null,
        page: 1,
      });
    },
    [pagination.pageIndex, updateUrl]
  );
  const setFilter = React.useCallback(
    (id: string, value: DataViewFilterValue | undefined) => {
      const definition = options.filters?.find(
        (candidate) => candidate.id === id
      );
      clearSelection();
      updateUrl({
        [definition?.parameter ?? id]: serializeFilter(value),
        page: 1,
      });
    },
    [clearSelection, options.filters, updateUrl]
  );
  const clearFilters = React.useCallback(() => {
    clearSelection();
    updateUrl({
      q: null,
      page: 1,
      ...Object.fromEntries(
        (options.filters ?? []).map((definition) => [
          definition.parameter ?? definition.id,
          null,
        ])
      ),
    });
    setSearchInput("");
  }, [clearSelection, options.filters, updateUrl]);

  const commitSearch = React.useCallback(
    (value: string) => {
      clearSelection();
      setSearchInput(value);
      updateUrl({ q: value.trim() || null, page: 1 });
    },
    [clearSelection, updateUrl]
  );

  const setSelectedIds = React.useCallback((ids: string[]) => {
    const uniqueIds = [...new Set(ids.filter(Boolean))].sort((a, b) =>
      a.localeCompare(b)
    );
    setRowSelection(Object.fromEntries(uniqueIds.map((id) => [id, true])));
  }, []);

  const toggleSelection = React.useCallback(
    (id: string, selected?: boolean) => {
      if (!id) return;
      setRowSelection((current) => {
        const next = { ...current };
        const shouldSelect = selected ?? !Boolean(next[id]);
        if (shouldSelect) next[id] = true;
        else delete next[id];
        return next;
      });
    },
    []
  );

  const removeSelectedIds = React.useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    const idsToRemove = new Set(ids);
    setRowSelection((current) =>
      Object.fromEntries(
        Object.entries(current).filter(
          ([id, selected]) => Boolean(selected) && !idsToRemove.has(id)
        )
      )
    );
  }, []);

  const selection = React.useMemo<ResourceSelection>(
    () => createResourceSelection(rowSelection),
    [rowSelection]
  );

  return {
    state,
    searchInput,
    setSearch: setSearchInput,
    commitSearch,
    setFilter,
    clearFilters,
    setPagination,
    setSorting,
    setColumnVisibility,
    setColumnOrder,
    setRowSelection,
    selection,
    clearSelection,
    setSelectedIds,
    toggleSelection,
    removeSelectedIds,
    setExpanded,
    setActiveView,
    setViewState,
    patchViewState,
    updateUrl,
  };
}
