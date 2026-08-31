import type { DataViewFilterValue, DataViewState } from './contracts';

export const DEFAULT_DATA_VIEW_PAGE_SIZE = 10;

function isRangeValue(value: DataViewFilterValue): value is { from?: string | number; to?: string | number } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizeDataViewFilterValue(value: DataViewFilterValue | undefined): DataViewFilterValue | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') return value.trim() || undefined;
  if (Array.isArray(value)) {
    const normalized = [...new Set(value.map((item) => item.trim()).filter(Boolean))].sort();
    return normalized.length ? normalized : undefined;
  }
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'boolean') return value;
  if (isRangeValue(value)) {
    const from = typeof value.from === 'string' ? value.from.trim() : value.from;
    const to = typeof value.to === 'string' ? value.to.trim() : value.to;
    const result = {
      ...(from !== undefined && from !== '' ? { from } : {}),
      ...(to !== undefined && to !== '' ? { to } : {}),
    };
    return Object.keys(result).length ? result : undefined;
  }
  return undefined;
}

export function normalizeDataViewFilters(filters: Record<string, DataViewFilterValue | undefined>): Record<string, DataViewFilterValue> {
  return Object.fromEntries(
    Object.entries(filters)
      .map(([key, value]) => [key, normalizeDataViewFilterValue(value)] as const)
      .filter((entry): entry is readonly [string, DataViewFilterValue] => entry[1] !== undefined)
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

export function normalizeDataViewState(state: DataViewState): DataViewState {
  const pageIndex = Number.isFinite(state.pagination.pageIndex) ? Math.max(0, Math.trunc(state.pagination.pageIndex)) : 0;
  const pageSize = Number.isFinite(state.pagination.pageSize) ? Math.max(1, Math.trunc(state.pagination.pageSize)) : DEFAULT_DATA_VIEW_PAGE_SIZE;
  const firstSort = state.sorting[0];
  return {
    search: state.search.trim(),
    filters: normalizeDataViewFilters(state.filters),
    sorting: firstSort ? [{ id: firstSort.id, desc: Boolean(firstSort.desc) }] : [],
    pagination: { pageIndex, pageSize },
    columnVisibility: Object.fromEntries(Object.entries(state.columnVisibility).sort(([left], [right]) => left.localeCompare(right))),
    columnOrder: [...new Set(state.columnOrder.filter(Boolean))],
    rowSelection: Object.fromEntries(Object.entries(state.rowSelection).filter(([, selected]) => Boolean(selected)).sort(([left], [right]) => left.localeCompare(right))),
    expanded: state.expanded === true ? true : {},
  };
}

export function createDataViewState(initial: Partial<DataViewState> = {}): DataViewState {
  return normalizeDataViewState({
    search: '',
    filters: {},
    sorting: [],
    pagination: { pageIndex: 0, pageSize: DEFAULT_DATA_VIEW_PAGE_SIZE },
    columnVisibility: {},
    columnOrder: [],
    rowSelection: {},
    expanded: {},
    ...initial,
  });
}

export function toDataViewQueryState(state: DataViewState) {
  const normalized = normalizeDataViewState(state);
  const firstSort = normalized.sorting[0];
  return {
    page: normalized.pagination.pageIndex + 1,
    pageSize: normalized.pagination.pageSize,
    ...(normalized.search ? { search: normalized.search } : {}),
    ...(Object.keys(normalized.filters).length ? { filters: normalized.filters } : {}),
    ...(firstSort ? { sort: { field: firstSort.id, order: firstSort.desc ? 'desc' as const : 'asc' as const } } : {}),
  };
}
