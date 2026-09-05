import type {
  DataViewFilterValue,
  DataViewStateInput,
  DataViewTableState,
  DataViewState,
  DataViewViewState,
  ResourceSelection,
  ResourceSelectionExecution,
} from "./contracts";

export const DEFAULT_DATA_VIEW_PAGE_SIZE = 20;

export function createDataViewState(
  initial: DataViewStateInput = {}
): DataViewState {
  const legacy = initial as DataViewStateInput;
  const initialTable = (initial.viewState?.table ?? {}) as DataViewViewState;
  return normalizeDataViewState({
    search: "",
    filters: {},
    sorting: [],
    activeView: "table",
    ...initial,
    viewState: {
      table: {
        pagination: { pageIndex: 0, pageSize: DEFAULT_DATA_VIEW_PAGE_SIZE },
        columnVisibility: {},
        columnOrder: [],
        rowSelection: {},
        expanded: {},
        ...initialTable,
        ...(legacy.pagination ? { pagination: legacy.pagination } : {}),
        ...(legacy.columnVisibility
          ? { columnVisibility: legacy.columnVisibility }
          : {}),
        ...(legacy.columnOrder ? { columnOrder: legacy.columnOrder } : {}),
        ...(legacy.rowSelection ? { rowSelection: legacy.rowSelection } : {}),
        ...(legacy.expanded !== undefined ? { expanded: legacy.expanded } : {}),
      } as unknown as DataViewViewState,
        ...(initial.viewState ?? {}),
    },
  });
}

function isRangeValue(
  value: DataViewFilterValue
): value is { from?: string | number; to?: string | number } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeDataViewFilterValue(
  value: DataViewFilterValue | undefined
): DataViewFilterValue | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized || undefined;
  }
  if (Array.isArray(value)) {
    const normalized = [
      ...new Set(value.map((item) => item.trim()).filter(Boolean)),
    ].sort((left, right) => left.localeCompare(right));
    return normalized.length ? normalized : undefined;
  }
  if (typeof value === "number")
    return Number.isFinite(value) ? value : undefined;
  if (typeof value === "boolean") return value;
  if (isRangeValue(value)) {
    const from =
      typeof value.from === "string" ? value.from.trim() : value.from;
    const to = typeof value.to === "string" ? value.to.trim() : value.to;
    const normalized = {
      ...(from !== undefined && from !== "" ? { from } : {}),
      ...(to !== undefined && to !== "" ? { to } : {}),
    };
    return Object.keys(normalized).length ? normalized : undefined;
  }
  return undefined;
}

export function normalizeDataViewFilters(
  filters: Record<string, DataViewFilterValue | undefined>
): Record<string, DataViewFilterValue> {
  return Object.fromEntries(
    Object.entries(filters)
      .map(
        ([key, value]) => [key, normalizeDataViewFilterValue(value)] as const
      )
      .filter(
        (entry): entry is readonly [string, DataViewFilterValue] =>
          entry[1] !== undefined
      )
      .sort(([left], [right]) => left.localeCompare(right))
  );
}

export function getDataViewTableState(
  state: DataViewState | DataViewStateInput
): DataViewTableState {
  const source = state.viewState?.table as
    | Partial<DataViewTableState>
    | undefined;
  const legacy = state as DataViewStateInput;
  return {
    pagination: source?.pagination ??
      legacy.pagination ?? { pageIndex: 0, pageSize: DEFAULT_DATA_VIEW_PAGE_SIZE },
    columnVisibility: source?.columnVisibility ?? legacy.columnVisibility ?? {},
    columnOrder: source?.columnOrder ?? legacy.columnOrder ?? [],
    rowSelection: source?.rowSelection ?? legacy.rowSelection ?? {},
    expanded: source?.expanded ?? legacy.expanded ?? {},
  };
}

export function getDataViewViewState(
  state: DataViewState,
  viewId: string = state.activeView
): DataViewViewState {
  return state.viewState[viewId] ?? {};
}

export function updateDataViewViewState(
  state: DataViewState,
  viewId: string,
  next: DataViewViewState
): DataViewState {
  return {
    ...state,
    viewState: {
      ...state.viewState,
      [viewId]: next,
    },
  };
}

export function updateDataViewTableState(
  state: DataViewState,
  patch: Partial<DataViewTableState>
): DataViewState {
  return updateDataViewViewState(state, "table", {
    ...(state.viewState.table ?? {}),
    ...(patch as unknown as DataViewViewState),
  });
}

function normalizeTableState(table: DataViewTableState): DataViewTableState {
  const pageIndex = Number.isFinite(table.pagination.pageIndex)
    ? Math.max(0, Math.trunc(table.pagination.pageIndex))
    : 0;
  const pageSize = Number.isFinite(table.pagination.pageSize)
    ? Math.max(1, Math.trunc(table.pagination.pageSize))
    : DEFAULT_DATA_VIEW_PAGE_SIZE;
  return {
    pagination: { pageIndex, pageSize },
    columnVisibility: Object.fromEntries(
      Object.entries(table.columnVisibility).sort(([left], [right]) =>
        left.localeCompare(right)
      )
    ),
    columnOrder: [...new Set(table.columnOrder.filter(Boolean))],
    rowSelection: Object.fromEntries(
      Object.entries(table.rowSelection)
        .filter(([, selected]) => Boolean(selected))
        .sort(([left], [right]) => left.localeCompare(right))
    ),
    expanded:
      table.expanded === true
        ? true
        : Object.fromEntries(
            Object.entries(table.expanded)
              .filter(([, expanded]) => Boolean(expanded))
              .sort(([left], [right]) => left.localeCompare(right))
          ),
  };
}

export function normalizeDataViewState(
  state: DataViewState | DataViewStateInput
): DataViewState {
  const table = normalizeTableState(getDataViewTableState(state));
  const firstSort = state.sorting?.[0];
  const activeView = state.activeView?.trim() || "table";
  const viewState = Object.fromEntries(
    Object.entries(state.viewState ?? {}).map(([id, value]) => [
      id,
      { ...(value ?? {}) },
    ])
  );
  viewState.table = table as unknown as DataViewViewState;

  return {
    search: (state.search ?? "").trim(),
    filters: normalizeDataViewFilters(state.filters ?? {}),
    sorting: firstSort
      ? [{ id: firstSort.id, desc: Boolean(firstSort.desc) }]
      : [],
    activeView,
    viewState,
  };
}

export function resolveResourceViews(
  views?: readonly import("./contracts").ResourceViewDefinition[]
): import("./contracts").ResourceViewDefinition[] {
  if (!views?.length) {
    return [{ id: "table", type: "table", default: true }];
  }
  const seen = new Set<string>();
  for (const [index, view] of views.entries()) {
    if (typeof view.id !== "string" || !view.id.trim()) {
      throw new Error(
        `Resource view at index ${index} must have a non-empty id.`
      );
    }
    if (seen.has(view.id)) {
      throw new Error(`Duplicate Resource view id "${view.id}".`);
    }
    seen.add(view.id);
  }
  const normalized = [...views];
  const defaultIndex = normalized.findIndex((view) => view.default);
  if (defaultIndex >= 0) return normalized;
  return normalized.map((view, index) => ({
    ...view,
    ...(index === 0 ? { default: true } : {}),
  }));
}

export function resolveResourceView(
  views: readonly import("./contracts").ResourceViewDefinition[] | undefined,
  requestedId?: string
): import("./contracts").ResourceViewDefinition {
  const resolved = resolveResourceViews(views);
  return (
    resolved.find((view) => view.id === requestedId) ??
    resolved.find((view) => view.default) ??
    resolved[0] ?? { id: "table", type: "table", default: true }
  );
}

/** Derive explicit Resource selection semantics from TanStack row state. */
export function createResourceSelection(
  rowSelection: DataViewTableState["rowSelection"]
): ResourceSelection {
  const selectedIds = Object.entries(rowSelection)
    .filter(([, selected]) => Boolean(selected))
    .map(([id]) => id)
    .sort((left, right) => left.localeCompare(right));

  return {
    mode: "explicit",
    selectedIds,
    executeIds: [...selectedIds],
  };
}

/**
 * Normalize existing bulk result conventions into selection semantics. The
 * default is all-requested success; backends that report failures retain those
 * IDs for a retry without requiring a new job framework.
 */
export function resolveResourceSelectionExecution(
  result: unknown,
  requestedIds: readonly string[]
): ResourceSelectionExecution {
  const requested = [...new Set(requestedIds)];
  if (!result || typeof result !== "object") {
    return { successIds: requested, failedIds: [] };
  }
  const value = result as {
    successIds?: unknown;
    succeededIds?: unknown;
    failedIds?: unknown;
    ids?: unknown;
    requestedIds?: unknown;
    failures?: unknown;
  };
  const toIds = (candidate: unknown) =>
    Array.isArray(candidate)
      ? candidate.filter((id): id is string => typeof id === "string")
      : [];
  const failedFromFailures = Array.isArray(value.failures)
    ? value.failures.flatMap((failure) =>
        failure &&
        typeof failure === "object" &&
        typeof (failure as { id?: unknown }).id === "string"
          ? [(failure as { id: string }).id]
          : []
      )
    : [];
  const successIds = toIds(value.successIds).length
    ? toIds(value.successIds)
    : toIds(value.succeededIds).length
      ? toIds(value.succeededIds)
      : toIds(value.ids);
  const failedIds = toIds(value.failedIds).length
    ? toIds(value.failedIds)
    : failedFromFailures;
  if (successIds.length === 0 && failedIds.length === 0) {
    return { successIds: requested, failedIds: [] };
  }
  const failed = new Set(failedIds);
  const requestedSet = new Set(requested);
  return {
    successIds: [...new Set(successIds)].filter(
      (id) => requestedSet.has(id) && !failed.has(id)
    ),
    failedIds: [...new Set(failedIds)].filter((id) => requested.includes(id)),
  };
}

export function toDataViewQueryState(state: DataViewState) {
  const normalized = normalizeDataViewState(state);
  const table = getDataViewTableState(normalized);
  return {
    page: table.pagination.pageIndex + 1,
    pageSize: table.pagination.pageSize,
    ...(normalized.search ? { search: normalized.search } : {}),
    ...(Object.keys(normalized.filters).length
      ? { filters: normalized.filters }
      : {}),
    ...(normalized.sorting[0]
      ? {
          sort: {
            field: normalized.sorting[0].id,
            order: normalized.sorting[0].desc
              ? ("desc" as const)
              : ("asc" as const),
          },
        }
      : {}),
  };
}

export interface DataViewPageResult<TData> {
  rows: TData[];
  count: number;
  page: number;
  pageSize: number;
}

export async function collectDataViewPages<TData>({
  fetchPage,
  pageSize = 100,
  maxRows = 10_000,
  maxPages = 250,
}: {
  fetchPage: (
    page: number,
    pageSize: number
  ) => Promise<DataViewPageResult<TData>>;
  pageSize?: number;
  maxRows?: number;
  maxPages?: number;
}): Promise<TData[]> {
  const safePageSize = Math.max(1, Math.min(100, Math.trunc(pageSize)));
  const safeMaxRows = Math.max(1, Math.trunc(maxRows));
  const safeMaxPages = Math.max(1, Math.trunc(maxPages));
  const rows: TData[] = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (
    rows.length < total &&
    rows.length < safeMaxRows &&
    page <= safeMaxPages
  ) {
    const result = await fetchPage(page, safePageSize);
    total = Math.max(0, result.count);
    if (!result.rows.length) break;
    rows.push(...result.rows.slice(0, safeMaxRows - rows.length));
    page += 1;
  }

  if (total > safeMaxRows) {
    throw new Error(
      `The filtered result contains ${total} rows, exceeding the synchronous export limit of ${safeMaxRows}.`
    );
  }
  if (rows.length < total && page > safeMaxPages) {
    throw new Error(
      `The export requires more than ${safeMaxPages} paginated requests. Narrow the filters and try again.`
    );
  }
  return rows;
}
