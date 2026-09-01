'use client';

import * as React from 'react';
import type {
  ColumnOrderState,
  ExpandedState,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import { useAdminLocation, useAdminNavigation } from '../navigation';
import type {
  DataViewFilterDefinition,
  DataViewFilterValue,
  DataViewState,
  DataViewViewId,
  DataViewViewsConfig,
  ResourceSelection,
} from './contracts';
import {
  createDataViewState,
  createResourceSelection,
  normalizeDataViewFilterValue,
} from './state';
import type { ResolvedDataViewViewsConfig } from './views';
import { resolveDataViewViewsConfig } from './views';

export interface UseDataViewUrlStateOptions {
  views?: ResolvedDataViewViewsConfig | DataViewViewsConfig;
  defaults?: {
    page?: number;
    pageSize?: number;
    sorting?: SortingState;
    filters?: Record<string, DataViewFilterValue>;
    columnVisibility?: VisibilityState;
    columnOrder?: ColumnOrderState;
  };
  filters?: readonly DataViewFilterDefinition[];
  allowedPageSizes?: readonly number[];
  allowedSortIds?: readonly string[];
  searchDebounceMs?: number;
  persistenceKey?: string;
  preserveSelectionAcrossPages?: boolean;
  /** Resets ephemeral selection when a Resource or scope boundary changes. */
  selectionScopeKey?: string;
}

const positiveInteger = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

function rangeParts(value: string): { from?: string; to?: string } {
  const separator = value.indexOf('..');
  if (separator < 0) return value ? { from: value } : {};
  const from = value.slice(0, separator);
  const to = value.slice(separator + 2);
  return { ...(from ? { from } : {}), ...(to ? { to } : {}) };
}

function parseFilter(
  definition: DataViewFilterDefinition,
  value: string | null,
): DataViewFilterValue | undefined {
  if (value === null || value === '') return undefined;
  if (definition.type === 'multi-select') return normalizeDataViewFilterValue(value.split(','));
  if (definition.type === 'boolean') {
    return value === 'true' ? true : value === 'false' ? false : undefined;
  }
  if (definition.type === 'number') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  if (definition.type === 'number-range') {
    const range = rangeParts(value);
    const from = range.from === undefined ? undefined : Number(range.from);
    const to = range.to === undefined ? undefined : Number(range.to);
    return normalizeDataViewFilterValue({
      ...(from !== undefined && Number.isFinite(from) ? { from } : {}),
      ...(to !== undefined && Number.isFinite(to) ? { to } : {}),
    });
  }
  if (definition.type === 'date-range') {
    return normalizeDataViewFilterValue(rangeParts(value));
  }
  return normalizeDataViewFilterValue(value);
}

function serializeFilter(value: DataViewFilterValue | undefined) {
  const normalized = normalizeDataViewFilterValue(value);
  if (normalized === undefined) return null;
  if (Array.isArray(normalized)) return normalized.join(',');
  if (typeof normalized === 'object' && normalized !== null) {
    return `${normalized.from ?? ''}..${normalized.to ?? ''}`;
  }
  return String(normalized);
}

export function useDataViewUrlState(options: UseDataViewUrlStateOptions = {}) {
  const navigation = useAdminNavigation();
  const { pathname, searchParams } = useAdminLocation();
  const defaults = options.defaults ?? {};
  const resolvedViews = React.useMemo<ResolvedDataViewViewsConfig>(
    () => options.views && 'normalize' in options.views
      ? options.views
      : resolveDataViewViewsConfig(options.views),
    [options.views],
  );
  const defaultPage = Math.max(1, defaults.page ?? 1);
  const defaultPageSize = Math.max(1, defaults.pageSize ?? 20);
  const allowedPageSizes = options.allowedPageSizes ?? [10, 20, 30, 50, 100];
  const debounceMs = Math.max(0, options.searchDebounceMs ?? 300);
  const committedSearch = searchParams.get('q')?.trim() ?? '';
  const [searchInput, setSearchInput] = React.useState(committedSearch);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    defaults.columnVisibility ?? {},
  );
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>(
    defaults.columnOrder ?? [],
  );
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const hydratedPersistenceKey = React.useRef<string | null>(null);
  const previousSelectionScopeKey = React.useRef(options.selectionScopeKey);
  const clearSelection = React.useCallback(() => setRowSelection({}), []);

  const updateUrl = React.useCallback((
    values: Record<string, string | number | null | undefined>,
    history: 'push' | 'replace' = 'replace',
  ) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(values).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') next.delete(key);
      else next.set(key, String(value));
    });
    const query = next.toString();
    navigation[history](query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [navigation, pathname, searchParams]);

  const rawView = searchParams.get('view');
  const view = resolvedViews.normalize(rawView);

  React.useEffect(() => {
    if (rawView === null || resolvedViews.isConfigured(rawView)) return;
    updateUrl({ view }, 'replace');
  }, [rawView, resolvedViews, updateUrl, view]);

  React.useEffect(() => setSearchInput(committedSearch), [committedSearch]);
  React.useEffect(() => {
    if (searchInput.trim() === committedSearch) return;
    const timer = window.setTimeout(() => {
      clearSelection();
      updateUrl({ q: searchInput.trim() || null, page: 1 });
    }, debounceMs);
    return () => window.clearTimeout(timer);
  }, [clearSelection, committedSearch, debounceMs, searchInput, updateUrl]);

  React.useEffect(() => {
    if (previousSelectionScopeKey.current === options.selectionScopeKey) return;
    previousSelectionScopeKey.current = options.selectionScopeKey;
    clearSelection();
  }, [clearSelection, options.selectionScopeKey]);

  React.useEffect(() => {
    const key = options.persistenceKey;
    if (!key) {
      hydratedPersistenceKey.current = null;
      return;
    }
    hydratedPersistenceKey.current = null;
    let timer: number | undefined;
    try {
      const saved = window.localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved) as {
          columnVisibility?: VisibilityState;
          columnOrder?: ColumnOrderState;
        };
        timer = window.setTimeout(() => {
          if (parsed.columnVisibility) setColumnVisibility(parsed.columnVisibility);
          if (parsed.columnOrder) setColumnOrder(parsed.columnOrder);
          hydratedPersistenceKey.current = key;
        }, 0);
      } else hydratedPersistenceKey.current = key;
    } catch {
      hydratedPersistenceKey.current = key;
    }
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [options.persistenceKey]);

  React.useEffect(() => {
    const key = options.persistenceKey;
    if (!key || hydratedPersistenceKey.current !== key) return;
    try {
      window.localStorage.setItem(key, JSON.stringify({ columnVisibility, columnOrder }));
    } catch {
      // Persistence is optional and cannot make a Resource unusable.
    }
  }, [columnOrder, columnVisibility, options.persistenceKey]);

  const pageSizeFromUrl = positiveInteger(searchParams.get('pageSize'), defaultPageSize);
  const pageSize = allowedPageSizes.includes(pageSizeFromUrl)
    ? pageSizeFromUrl
    : defaultPageSize;
  const pagination = React.useMemo<PaginationState>(() => ({
    pageIndex: positiveInteger(searchParams.get('page'), defaultPage) - 1,
    pageSize,
  }), [defaultPage, pageSize, searchParams]);
  const rawSort = searchParams.get('sort') ?? '';
  const sorting = React.useMemo<SortingState>(() => {
    if (!rawSort) return defaults.sorting ?? [];
    const desc = rawSort.startsWith('-');
    const id = desc ? rawSort.slice(1) : rawSort;
    if (!id || (options.allowedSortIds && !options.allowedSortIds.includes(id))) {
      return defaults.sorting ?? [];
    }
    return [{ id, desc }];
  }, [defaults.sorting, options.allowedSortIds, rawSort]);
  const filters = React.useMemo(() => {
    const entries = (options.filters ?? []).flatMap((definition) => {
      const value = parseFilter(
        definition,
        searchParams.get(definition.parameter ?? definition.id),
      );
      return value === undefined ? [] : [[definition.id, value] as const];
    });
    return { ...(defaults.filters ?? {}), ...Object.fromEntries(entries) };
  }, [defaults.filters, options.filters, searchParams]);

  const previousQuerySignature = React.useRef<string | null>(null);
  React.useEffect(() => {
    const signature = JSON.stringify({
      search: committedSearch,
      filters,
      ...(options.preserveSelectionAcrossPages !== true
        ? { page: pagination.pageIndex, pageSize: pagination.pageSize }
        : {}),
    });
    if (previousQuerySignature.current === null) {
      previousQuerySignature.current = signature;
      return;
    }
    if (previousQuerySignature.current !== signature) {
      previousQuerySignature.current = signature;
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

  const state = React.useMemo<DataViewState>(() => createDataViewState({
    search: committedSearch,
    filters,
    sorting,
    pagination,
    columnVisibility,
    columnOrder,
    rowSelection,
    expanded,
    view,
  }), [
    columnOrder,
    columnVisibility,
    committedSearch,
    expanded,
    filters,
    pagination,
    rowSelection,
    sorting,
    view,
  ]);

  const setPagination = React.useCallback((next: PaginationState) => {
    const sizeChanged = next.pageSize !== pagination.pageSize;
    if (options.preserveSelectionAcrossPages !== true) clearSelection();
    updateUrl({ page: sizeChanged ? 1 : next.pageIndex + 1, pageSize: next.pageSize }, 'push');
  }, [clearSelection, options.preserveSelectionAcrossPages, pagination.pageSize, updateUrl]);
  const setSorting = React.useCallback((next: SortingState) => {
    const first = next[0];
    clearSelection();
    updateUrl({ sort: first ? `${first.desc ? '-' : ''}${first.id}` : null, page: 1 });
  }, [clearSelection, updateUrl]);
  const setFilter = React.useCallback((id: string, value: DataViewFilterValue | undefined) => {
    const definition = options.filters?.find((candidate) => candidate.id === id);
    clearSelection();
    updateUrl({ [definition?.parameter ?? id]: serializeFilter(value), page: 1 });
  }, [clearSelection, options.filters, updateUrl]);
  const clearFilters = React.useCallback(() => {
    clearSelection();
    updateUrl({
      q: null,
      page: 1,
      ...Object.fromEntries(
        (options.filters ?? []).map((definition) => [definition.parameter ?? definition.id, null]),
      ),
    });
    setSearchInput('');
  }, [clearSelection, options.filters, updateUrl]);
  const commitSearch = React.useCallback((value: string) => {
    clearSelection();
    setSearchInput(value);
    updateUrl({ q: value.trim() || null, page: 1 });
  }, [clearSelection, updateUrl]);
  const setSelectedIds = React.useCallback((ids: string[]) => {
    const unique = [...new Set(ids.filter(Boolean))].sort((a, b) => a.localeCompare(b));
    setRowSelection(Object.fromEntries(unique.map((id) => [id, true])));
  }, []);
  const toggleSelection = React.useCallback((id: string, selected?: boolean) => {
    if (!id) return;
    setRowSelection((current) => {
      const next = { ...current };
      const shouldSelect = selected ?? !Boolean(next[id]);
      if (shouldSelect) next[id] = true;
      else delete next[id];
      return next;
    });
  }, []);
  const removeSelectedIds = React.useCallback((ids: string[]) => {
    const removals = new Set(ids);
    setRowSelection((current) => Object.fromEntries(
      Object.entries(current).filter(([id, selected]) => Boolean(selected) && !removals.has(id)),
    ));
  }, []);
  const setView = React.useCallback((next: DataViewViewId) => {
    updateUrl({ view: resolvedViews.normalize(next) }, 'push');
  }, [resolvedViews, updateUrl]);
  const selection = React.useMemo<ResourceSelection>(
    () => createResourceSelection(rowSelection),
    [rowSelection],
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
    setView,
    updateUrl,
  };
}
