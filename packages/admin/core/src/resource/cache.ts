import type { QueryClient, QueryKey, Updater } from "@tanstack/react-query";
import type { ResourceListResult } from "./contracts/resource-query";
import type { ResourceScope } from "./scope";
import { scopeResourceKey } from "./scope";

export interface ResourceCacheToolsOptions {
  client: QueryClient;
  scope: ResourceScope;
  storeId?: string;
  /**
   * The default list key used by the list helpers. It is intentionally an
   * unscoped Resource key; the cache boundary applies scope internally.
   */
  listQueryKey?: QueryKey;
}

export interface ResourceCacheTools<TData = unknown> {
  /** Whether this cache can address a valid Resource namespace. */
  readonly available: boolean;
  readonly scope: ResourceScope;
  readonly storeId?: string;
  /** Read a Resource-relative query key from this bound namespace. */
  get<TValue = unknown>(queryKey: QueryKey): TValue | undefined;
  /** Write a Resource-relative query key in this bound namespace. */
  set<TValue = unknown>(
    queryKey: QueryKey,
    updater: Updater<TValue | undefined, TValue | undefined>
  ): TValue | undefined;
  /** Update a Resource-relative query key in this bound namespace. */
  update<TValue = unknown>(
    queryKey: QueryKey,
    updater: (current: TValue | undefined) => TValue | undefined
  ): TValue | undefined;
  /** Invalidate all Resource queries below a relative key. */
  invalidate(queryKey: QueryKey): Promise<void>;
  /** Remove all Resource queries below a relative key. */
  remove(queryKey: QueryKey): void;
  getQueryData<TValue = unknown>(queryKey: QueryKey): TValue | undefined;
  setQueryData<TValue = unknown>(
    queryKey: QueryKey,
    updater: Updater<TValue | undefined, TValue | undefined>
  ): TValue | undefined;
  updateQueryData<TValue = unknown>(
    queryKey: QueryKey,
    updater: (current: TValue | undefined) => TValue | undefined
  ): TValue | undefined;
  getListData<TList = ResourceListResult<TData>>(
    queryKey?: QueryKey
  ): TList | undefined;
  setListData<TList = ResourceListResult<TData>>(
    updater: Updater<TList | undefined, TList | undefined>,
    queryKey?: QueryKey
  ): TList | undefined;
  updateListData<TList = ResourceListResult<TData>>(
    updater: (current: TList | undefined) => TList | undefined,
    queryKey?: QueryKey
  ): TList | undefined;
  invalidateList(queryKey?: QueryKey): Promise<void>;
  removeList(queryKey?: QueryKey): void;
}

/** Canonical public name for the scope-bound Resource cache facade. */
export type ResourceCache<TData = unknown> = ResourceCacheTools<TData>;

/**
 * Creates a cache facade whose every operation is scoped to one Resource
 * namespace. Callers provide the same unscoped keys used by Resource query
 * definitions; they never need to reconstruct Store-prefixed keys.
 *
 * A Store Resource without a Store context is unavailable. Its methods are
 * deliberate no-ops so a late callback cannot write to a global or another
 * Store's cache.
 */
export function createResourceCacheTools<TData = unknown>({
  client,
  scope,
  storeId,
  listQueryKey,
}: ResourceCacheToolsOptions): ResourceCacheTools<TData> {
  const available = scope === "global" || Boolean(storeId);

  const scopedKey = (queryKey: QueryKey): readonly unknown[] | undefined => {
    if (!available) return undefined;
    return scopeResourceKey(scope, queryKey, storeId);
  };

  const getQueryData = <TValue>(queryKey: QueryKey) => {
    const key = scopedKey(queryKey);
    return key ? client.getQueryData<TValue>(key) : undefined;
  };

  const setQueryData = <TValue>(
    queryKey: QueryKey,
    updater: Updater<TValue | undefined, TValue | undefined>
  ) => {
    const key = scopedKey(queryKey);
    return key ? client.setQueryData<TValue>(key, updater) : undefined;
  };

  const invalidate = async (queryKey: QueryKey) => {
    const key = scopedKey(queryKey);
    if (!key) return;
    await client.invalidateQueries({ queryKey: key });
  };

  const remove = (queryKey: QueryKey) => {
    const key = scopedKey(queryKey);
    if (!key) return;
    client.removeQueries({ queryKey: key });
  };

  const resolveListKey = (queryKey?: QueryKey) => queryKey ?? listQueryKey;

  return {
    available,
    scope,
    ...(storeId ? { storeId } : {}),
    get: getQueryData,
    set: setQueryData,
    update: <TValue>(
      queryKey: QueryKey,
      updater: (current: TValue | undefined) => TValue | undefined
    ) => setQueryData<TValue>(queryKey, updater),
    remove,
    getQueryData,
    setQueryData,
    updateQueryData: <TValue>(
      queryKey: QueryKey,
      updater: (current: TValue | undefined) => TValue | undefined
    ) => setQueryData<TValue>(queryKey, updater),
    invalidate,
    getListData: <TList = ResourceListResult<TData>>(queryKey?: QueryKey) => {
      const key = resolveListKey(queryKey);
      return key ? getQueryData<TList>(key) : undefined;
    },
    setListData: <TList = ResourceListResult<TData>>(
      updater: Updater<TList | undefined, TList | undefined>,
      queryKey?: QueryKey
    ) => {
      const key = resolveListKey(queryKey);
      return key ? setQueryData<TList>(key, updater) : undefined;
    },
    updateListData: <TList = ResourceListResult<TData>>(
      updater: (current: TList | undefined) => TList | undefined,
      queryKey?: QueryKey
    ) => {
      const key = resolveListKey(queryKey);
      return key ? setQueryData<TList>(key, updater) : undefined;
    },
    invalidateList: async (queryKey?: QueryKey) => {
      const key = resolveListKey(queryKey);
      if (key) await invalidate(key);
    },
    removeList: (queryKey?: QueryKey) => {
      const key = resolveListKey(queryKey);
      if (key) remove(key);
    },
  };
}
