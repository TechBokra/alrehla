'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ColumnOrderState, PaginationState, RowSelectionState, SortingState, VisibilityState } from '@tanstack/react-table';
import { createDataViewState, normalizeDataViewFilterValue } from './state';
import type { DataViewFilterDefinition, DataViewFilterValue, DataViewState } from './contracts';

export interface UseDataViewUrlStateOptions {
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
}

const positiveInteger = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const parseFilter = (definition: DataViewFilterDefinition, value: string | null): DataViewFilterValue | undefined => {
  if (value === null || value === '') return undefined;
  if (definition.type === 'multi-select') return normalizeDataViewFilterValue(value.split(','));
  if (definition.type === 'boolean') return value === 'true' ? true : value === 'false' ? false : undefined;
  if (definition.type === 'number') {
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
  }
  return normalizeDataViewFilterValue(value);
};

const serializeFilter = (value: DataViewFilterValue | undefined) => {
  const normalized = normalizeDataViewFilterValue(value);
  if (normalized === undefined) return null;
  if (Array.isArray(normalized)) return normalized.join(',');
  if (typeof normalized === 'object' && normalized !== null) return `${normalized.from ?? ''}..${normalized.to ?? ''}`;
  return String(normalized);
};

export function useDataViewUrlState(options: UseDataViewUrlStateOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const defaults = options.defaults ?? {};
  const defaultPage = Math.max(1, defaults.page ?? 1);
  const defaultPageSize = Math.max(1, defaults.pageSize ?? DEFAULT_PAGE_SIZE);
  const allowedPageSizes = options.allowedPageSizes ?? [5, 10, 20, 50, 100];
  const committedSearch = searchParams.get('q')?.trim() ?? '';
  const [searchInput, setSearchInput] = React.useState(committedSearch);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(defaults.columnVisibility ?? {});
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>(defaults.columnOrder ?? []);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const updateUrl = React.useCallback((values: Record<string, string | number | null | undefined>, history: 'push' | 'replace' = 'replace') => {
    const next = new URLSearchParams(Array.from(searchParams.entries()) as Array<[string, string]>);
    Object.entries(values).forEach(([key, value]) => value === null || value === undefined || value === '' ? next.delete(key) : next.set(key, String(value)));
    const query = next.toString();
    router[history](query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  React.useEffect(() => setSearchInput(committedSearch), [committedSearch]);
  React.useEffect(() => {
    const debounceMs = Math.max(0, options.searchDebounceMs ?? 300);
    if (searchInput.trim() === committedSearch) return;
    const timer = window.setTimeout(() => updateUrl({ q: searchInput.trim() || null, page: 1 }), debounceMs);
    return () => window.clearTimeout(timer);
  }, [committedSearch, options.searchDebounceMs, searchInput, updateUrl]);

  React.useEffect(() => {
    if (!options.persistenceKey) return;
    try {
      const saved = window.localStorage.getItem(options.persistenceKey);
      if (!saved) return;
      const parsed = JSON.parse(saved) as { columnVisibility?: VisibilityState; columnOrder?: ColumnOrderState };
      if (parsed.columnVisibility) setColumnVisibility(parsed.columnVisibility);
      if (parsed.columnOrder) setColumnOrder(parsed.columnOrder);
    } catch {
      // Local persistence is optional and must never make a resource unusable.
    }
  }, [options.persistenceKey]);
  React.useEffect(() => {
    if (options.persistenceKey) window.localStorage.setItem(options.persistenceKey, JSON.stringify({ columnVisibility, columnOrder }));
  }, [columnOrder, columnVisibility, options.persistenceKey]);

  const pageSizeFromUrl = positiveInteger(searchParams.get('pageSize'), defaultPageSize);
  const pageSize = allowedPageSizes.includes(pageSizeFromUrl) ? pageSizeFromUrl : defaultPageSize;
  const pagination = React.useMemo<PaginationState>(() => ({ pageIndex: positiveInteger(searchParams.get('page'), defaultPage) - 1, pageSize }), [defaultPage, pageSize, searchParams]);
  const sorting = React.useMemo<SortingState>(() => {
    const rawSort = searchParams.get('sort') ?? '';
    if (!rawSort) return defaults.sorting ?? [];
    const desc = rawSort.startsWith('-');
    const id = desc ? rawSort.slice(1) : rawSort;
    if (!id || (options.allowedSortIds && !options.allowedSortIds.includes(id))) return defaults.sorting ?? [];
    return [{ id, desc }];
  }, [defaults.sorting, options.allowedSortIds, searchParams]);
  const filters = React.useMemo(() => {
    const parsed = (options.filters ?? []).flatMap((definition) => {
      const value = parseFilter(definition, searchParams.get(definition.parameter ?? definition.id));
      return value === undefined ? [] : [[definition.id, value] as const];
    });
    return { ...(defaults.filters ?? {}), ...Object.fromEntries(parsed) };
  }, [defaults.filters, options.filters, searchParams]);
  const state = React.useMemo<DataViewState>(() => createDataViewState({ search: committedSearch, filters, sorting, pagination, columnVisibility, columnOrder, rowSelection }), [columnOrder, columnVisibility, committedSearch, filters, pagination, rowSelection, sorting]);

  const setPagination = React.useCallback((next: PaginationState) => updateUrl({ page: next.pageSize === pagination.pageSize ? next.pageIndex + 1 : 1, pageSize: next.pageSize }, 'push'), [pagination.pageSize, updateUrl]);
  const setSorting = React.useCallback((next: SortingState) => {
    const first = next[0];
    updateUrl({ sort: first ? `${first.desc ? '-' : ''}${first.id}` : null, page: 1 });
  }, [updateUrl]);
  const setFilter = React.useCallback((id: string, value: DataViewFilterValue | undefined) => {
    const definition = options.filters?.find((item) => item.id === id);
    updateUrl({ [definition?.parameter ?? id]: serializeFilter(value), page: 1 });
  }, [options.filters, updateUrl]);
  const clearFilters = React.useCallback(() => {
    updateUrl({ q: null, page: 1, ...Object.fromEntries((options.filters ?? []).map((definition) => [definition.parameter ?? definition.id, null])) });
    setSearchInput('');
  }, [options.filters, updateUrl]);

  return { state, searchInput, setSearch: setSearchInput, commitSearch: (value: string) => { setSearchInput(value); updateUrl({ q: value.trim() || null, page: 1 }); }, setFilter, clearFilters, setPagination, setSorting, setColumnVisibility, setColumnOrder, setRowSelection, updateUrl };
}

const DEFAULT_PAGE_SIZE = 10;
