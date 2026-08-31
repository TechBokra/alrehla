import type { QueryClient, QueryKey, Updater } from '@tanstack/react-query';
import type { ResourceListResult } from './contracts/resource-query';
import type { ResourceScope } from './scope';
import { scopeResourceKey } from './scope';

export interface ResourceCacheToolsOptions {
  client: QueryClient;
  scope: ResourceScope;
  scopeId?: string;
  /** Resource-relative default list key. */
  listQueryKey?: QueryKey;
}

export interface ResourceCacheTools<TData = unknown> {
  readonly available: boolean;
  readonly scope: ResourceScope;
  readonly scopeId?: string;
  get<TValue = unknown>(queryKey: QueryKey): TValue | undefined;
  set<TValue = unknown>(
    queryKey: QueryKey,
    updater: Updater<TValue | undefined, TValue | undefined>,
  ): TValue | undefined;
  update<TValue = unknown>(
    queryKey: QueryKey,
    updater: (current: TValue | undefined) => TValue | undefined,
  ): TValue | undefined;
  invalidate(queryKey: QueryKey): Promise<void>;
  remove(queryKey: QueryKey): void;
  getQueryData<TValue = unknown>(queryKey: QueryKey): TValue | undefined;
  setQueryData<TValue = unknown>(
    queryKey: QueryKey,
    updater: Updater<TValue | undefined, TValue | undefined>,
  ): TValue | undefined;
  updateQueryData<TValue = unknown>(
    queryKey: QueryKey,
    updater: (current: TValue | undefined) => TValue | undefined,
  ): TValue | undefined;
  getListData<TList = ResourceListResult<TData>>(queryKey?: QueryKey): TList | undefined;
  setListData<TList = ResourceListResult<TData>>(
    updater: Updater<TList | undefined, TList | undefined>,
    queryKey?: QueryKey,
  ): TList | undefined;
  updateListData<TList = ResourceListResult<TData>>(
    updater: (current: TList | undefined) => TList | undefined,
    queryKey?: QueryKey,
  ): TList | undefined;
  invalidateList(queryKey?: QueryKey): Promise<void>;
  removeList(queryKey?: QueryKey): void;
}

export type ResourceCache<TData = unknown> = ResourceCacheTools<TData>;

/**
 * Every operation is bound to the captured scope. Missing scoped context is
 * deliberately unavailable/no-op so late callbacks cannot leak globally.
 */
export function createResourceCacheTools<TData = unknown>({
  client,
  scope,
  scopeId,
  listQueryKey,
}: ResourceCacheToolsOptions): ResourceCacheTools<TData> {
  const available = scope === 'global' || Boolean(scopeId);
  const scopedKey = (queryKey: QueryKey): readonly unknown[] | undefined =>
    available ? scopeResourceKey(scope, queryKey, scopeId) : undefined;

  const getQueryData = <TValue,>(queryKey: QueryKey) => {
    const key = scopedKey(queryKey);
    return key ? client.getQueryData<TValue>(key) : undefined;
  };
  const setQueryData = <TValue,>(
    queryKey: QueryKey,
    updater: Updater<TValue | undefined, TValue | undefined>,
  ) => {
    const key = scopedKey(queryKey);
    return key ? client.setQueryData<TValue>(key, updater) : undefined;
  };
  const invalidate = async (queryKey: QueryKey) => {
    const key = scopedKey(queryKey);
    if (key) await client.invalidateQueries({ queryKey: key });
  };
  const remove = (queryKey: QueryKey) => {
    const key = scopedKey(queryKey);
    if (key) client.removeQueries({ queryKey: key });
  };
  const resolveListKey = (queryKey?: QueryKey) => queryKey ?? listQueryKey;

  return {
    available,
    scope,
    ...(scopeId ? { scopeId } : {}),
    get: getQueryData,
    set: setQueryData,
    update: (queryKey, updater) => setQueryData(queryKey, updater),
    invalidate,
    remove,
    getQueryData,
    setQueryData,
    updateQueryData: (queryKey, updater) => setQueryData(queryKey, updater),
    getListData: (queryKey) => {
      const key = resolveListKey(queryKey);
      return key ? getQueryData(key) : undefined;
    },
    setListData: (updater, queryKey) => {
      const key = resolveListKey(queryKey);
      return key ? setQueryData(key, updater) : undefined;
    },
    updateListData: (updater, queryKey) => {
      const key = resolveListKey(queryKey);
      return key ? setQueryData(key, updater) : undefined;
    },
    invalidateList: async (queryKey) => {
      const key = resolveListKey(queryKey);
      if (key) await invalidate(key);
    },
    removeList: (queryKey) => {
      const key = resolveListKey(queryKey);
      if (key) remove(key);
    },
  };
}
