import type {
  DataViewFilterValue,
  DataViewQueryState,
  DataViewState,
  ResourceSelection,
  ResourceSelectionExecution,
} from './contracts';

export const DEFAULT_DATA_VIEW_PAGE_SIZE = 20;

function isRangeValue(
  value: DataViewFilterValue,
): value is { from?: string | number; to?: string | number } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizeDataViewFilterValue(
  value: DataViewFilterValue | undefined,
): DataViewFilterValue | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') return value.trim() || undefined;
  if (Array.isArray(value)) {
    const normalized = [...new Set(value.map((item) => item.trim()).filter(Boolean))]
      .sort((left, right) => left.localeCompare(right));
    return normalized.length ? normalized : undefined;
  }
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'boolean') return value;
  if (isRangeValue(value)) {
    const from = typeof value.from === 'string' ? value.from.trim() : value.from;
    const to = typeof value.to === 'string' ? value.to.trim() : value.to;
    const normalized = {
      ...(from !== undefined && from !== '' ? { from } : {}),
      ...(to !== undefined && to !== '' ? { to } : {}),
    };
    return Object.keys(normalized).length ? normalized : undefined;
  }
  return undefined;
}

export function normalizeDataViewFilters(
  filters: Record<string, DataViewFilterValue | undefined>,
): Record<string, DataViewFilterValue> {
  return Object.fromEntries(
    Object.entries(filters)
      .map(([key, value]) => [key, normalizeDataViewFilterValue(value)] as const)
      .filter(
        (entry): entry is readonly [string, DataViewFilterValue] => entry[1] !== undefined,
      )
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

export function selectDataViewQueryState(state: DataViewState): DataViewQueryState {
  return {
    search: state.search,
    filters: state.filters,
    sorting: state.sorting,
    pagination: state.pagination,
  };
}

export function normalizeDataViewState(state: DataViewState): DataViewState {
  const pageIndex = Number.isFinite(state.pagination.pageIndex)
    ? Math.max(0, Math.trunc(state.pagination.pageIndex))
    : 0;
  const pageSize = Number.isFinite(state.pagination.pageSize)
    ? Math.max(1, Math.trunc(state.pagination.pageSize))
    : DEFAULT_DATA_VIEW_PAGE_SIZE;
  const firstSort = state.sorting[0];
  return {
    search: state.search.trim(),
    filters: normalizeDataViewFilters(state.filters),
    sorting: firstSort ? [{ id: firstSort.id, desc: Boolean(firstSort.desc) }] : [],
    pagination: { pageIndex, pageSize },
    view: state.view ?? 'table',
    columnVisibility: Object.fromEntries(
      Object.entries(state.columnVisibility).sort(([left], [right]) => left.localeCompare(right)),
    ),
    columnOrder: [...new Set(state.columnOrder.filter(Boolean))],
    rowSelection: Object.fromEntries(
      Object.entries(state.rowSelection)
        .filter(([, selected]) => Boolean(selected))
        .sort(([left], [right]) => left.localeCompare(right)),
    ),
    expanded: state.expanded === true
      ? true
      : Object.fromEntries(
          Object.entries(state.expanded)
            .filter(([, expanded]) => Boolean(expanded))
            .sort(([left], [right]) => left.localeCompare(right)),
        ),
  };
}

export function createDataViewState(initial: Partial<DataViewState> = {}): DataViewState {
  return normalizeDataViewState({
    search: '',
    filters: {},
    sorting: [],
    pagination: { pageIndex: 0, pageSize: DEFAULT_DATA_VIEW_PAGE_SIZE },
    view: 'table',
    columnVisibility: {},
    columnOrder: [],
    rowSelection: {},
    expanded: {},
    ...initial,
  });
}

export function createResourceSelection(
  rowSelection: DataViewState['rowSelection'],
): ResourceSelection {
  const selectedIds = Object.entries(rowSelection)
    .filter(([, selected]) => Boolean(selected))
    .map(([id]) => id)
    .sort((left, right) => left.localeCompare(right));
  return { mode: 'explicit', selectedIds, executeIds: [...selectedIds] };
}

export function resolveResourceSelectionExecution(
  result: unknown,
  requestedIds: readonly string[],
): ResourceSelectionExecution {
  const requested = [...new Set(requestedIds)];
  if (!result || typeof result !== 'object') return { successIds: requested, failedIds: [] };
  const value = result as Record<string, unknown>;
  const toIds = (candidate: unknown) => Array.isArray(candidate)
    ? candidate.filter((id): id is string => typeof id === 'string')
    : [];
  const failureIds = Array.isArray(value.failures)
    ? value.failures.flatMap((failure) =>
        failure && typeof failure === 'object' &&
        typeof (failure as { id?: unknown }).id === 'string'
          ? [(failure as { id: string }).id]
          : [],
      )
    : [];
  const successIds = toIds(value.successIds).length
    ? toIds(value.successIds)
    : toIds(value.succeededIds).length
      ? toIds(value.succeededIds)
      : toIds(value.ids);
  const failedIds = toIds(value.failedIds).length ? toIds(value.failedIds) : failureIds;
  if (!successIds.length && !failedIds.length) return { successIds: requested, failedIds: [] };
  const requestedSet = new Set(requested);
  const failedSet = new Set(failedIds);
  const inferredSuccessIds = successIds.length
    ? successIds
    : requested.filter((id) => !failedSet.has(id));
  return {
    successIds: [...new Set(inferredSuccessIds)].filter(
      (id) => requestedSet.has(id) && !failedSet.has(id),
    ),
    failedIds: [...new Set(failedIds)].filter((id) => requestedSet.has(id)),
  };
}

export function toDataViewQueryParams(state: DataViewState) {
  const normalized = normalizeDataViewState(state);
  const sort = normalized.sorting[0];
  return {
    page: normalized.pagination.pageIndex + 1,
    pageSize: normalized.pagination.pageSize,
    ...(normalized.search ? { search: normalized.search } : {}),
    ...(Object.keys(normalized.filters).length ? { filters: normalized.filters } : {}),
    ...(sort ? { sort: { field: sort.id, order: sort.desc ? 'desc' as const : 'asc' as const } } : {}),
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
  fetchPage(page: number, pageSize: number): Promise<DataViewPageResult<TData>>;
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
  while (rows.length < total && rows.length < safeMaxRows && page <= safeMaxPages) {
    const result = await fetchPage(page, safePageSize);
    total = Math.max(0, result.count);
    if (!result.rows.length) break;
    rows.push(...result.rows.slice(0, safeMaxRows - rows.length));
    page += 1;
  }
  if (total > safeMaxRows) throw new Error(`Export exceeds the ${safeMaxRows} row limit.`);
  if (rows.length < total && page > safeMaxPages) {
    throw new Error(`Export requires more than ${safeMaxPages} requests.`);
  }
  return rows;
}
