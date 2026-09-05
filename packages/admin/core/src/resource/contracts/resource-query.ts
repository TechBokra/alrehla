import type { MaybePromise } from "@eng-mohamedelsayed/mutations/types";
import type {
  DataViewState,
  JsonValue,
} from "../../data-view/contracts";

export interface ResourceExecutionContext {
  readonly storeId?: string;
}

export interface ResourceQueryContext {
  state: DataViewState;
  /**
   * Authoritative effective authorized view, independent of state.activeView.
   * Null when no view can execute; public views can resolve while other
   * view permissions are still loading.
   */
  view: {
    id: string;
    type: string;
    config: Record<string, JsonValue>;
    state: Record<string, JsonValue>;
  } | null;
  execution?: ResourceExecutionContext;
  /** TanStack Query cancellation signal for the current request. */
  signal?: AbortSignal;
}

/** Explicit name for adapters that want the full Resource query context. */
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
  meta?: ResourceListResult<TData>["meta"]
): ResourceListResult<TData> {
  const normalizedRows: readonly TData[] = Array.isArray(rows) ? rows : [];
  return {
    rows: normalizedRows,
    count: typeof count === "number" ? count : normalizedRows.length,
    ...(meta ? { meta } : {}),
  };
}

export interface ResourceQueryPolicy {
  /** Inherits the QueryClient default when omitted. */
  staleTime?: number;
  gcTime?: number;
  retry?: boolean | number;
  refetchOnWindowFocus?: boolean;
  /** The default uses server data only for the canonical first list state. */
  initialData?: "default" | "never";
}

export interface ResourceQueryDefinition<
  TData,
  TQueryRaw,
  TContext = ResourceQueryContext,
> {
  queryKey: (context: TContext) => readonly unknown[];
  /** Consume `context.signal` in SDK/fetch requests to cancel stale queries. */
  queryFn: (context: TContext) => MaybePromise<TQueryRaw>;
  normalize: (response: TQueryRaw) => ResourceListResult<TData>;
  policy?: ResourceQueryPolicy;
  useInitialData?: (context: TContext) => boolean;
}
