import type { DataViewState } from '../../data-view/contracts';
import type { ResourceExecutionContext } from '../execution-context';

export interface ResourceQueryContext {
  state: DataViewState;
  execution?: ResourceExecutionContext;
  /** TanStack cancellation signal for the current request. */
  signal?: AbortSignal;
}

export type ResourceQueryExecutionContext = ResourceQueryContext;

export interface ResourceListResult<TData> {
  rows: readonly TData[];
  count: number;
  meta?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  };
}

export function normalizeResourceList<TData>(
  rows: readonly TData[] | null | undefined,
  count?: number | null,
  meta?: ResourceListResult<TData>['meta'],
): ResourceListResult<TData> {
  const normalizedRows = Array.isArray(rows) ? rows : [];
  return {
    rows: normalizedRows,
    count: typeof count === 'number' ? count : normalizedRows.length,
    ...(meta ? { meta } : {}),
  };
}

export interface ResourceQueryPolicy {
  staleTime?: number;
  gcTime?: number;
  retry?: boolean | number;
  refetchOnWindowFocus?: boolean;
  initialData?: 'default' | 'never';
}

export interface ResourceQueryDefinition<
  TData,
  TQueryRaw,
  TContext = ResourceQueryContext,
> {
  queryKey(context: TContext): readonly unknown[];
  queryFn(context: TContext): Promise<TQueryRaw> | TQueryRaw;
  normalize(response: TQueryRaw): ResourceListResult<TData>;
  enabled?: (context: TContext) => boolean;
  policy?: ResourceQueryPolicy;
  useInitialData?: (context: TContext) => boolean;
  /** @deprecated Use policy.staleTime. */
  staleTime?: number;
}
