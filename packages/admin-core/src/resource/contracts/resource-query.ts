import type { DataViewState } from '../../data-view/contracts';

export interface ResourceQueryContext { state: DataViewState }

export interface ResourceListResult<TData> {
  rows: readonly TData[];
  count: number;
  meta?: { page?: number; pageSize?: number };
}

export function normalizeResourceList<TData>(rows: readonly TData[] | null | undefined, count?: number | null, meta?: ResourceListResult<TData>['meta']): ResourceListResult<TData> {
  const normalizedRows = Array.isArray(rows) ? rows : [];
  return { rows: normalizedRows, count: typeof count === 'number' ? count : normalizedRows.length, ...(meta ? { meta } : {}) };
}

export interface ResourceQueryDefinition<TData, TQueryRaw, TContext = ResourceQueryContext> {
  queryKey: (context: TContext) => readonly unknown[];
  queryFn: (context: TContext) => Promise<TQueryRaw> | TQueryRaw;
  normalize: (response: TQueryRaw) => ResourceListResult<TData>;
  enabled?: (context: TContext) => boolean;
  staleTime?: number;
}
