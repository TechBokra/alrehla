'use client';

import * as React from 'react';
import { isCancelledError, useQuery } from '@tanstack/react-query';
import {
  normalizeMutationError,
  type AppMutationError,
} from '@alrehla/mutations';
import type { DataViewState } from '../data-view/contracts';
import { selectDataViewQueryState } from '../data-view/state';
import type {
  ResourceDefinition,
  ResourceListResult,
  ResourceQueryContext,
} from './contracts';
import { normalizeResourceList } from './contracts';
import { useResourceExecutionContext } from './execution-context';
import { DEFAULT_RESOURCE_SCOPE, scopeResourceKey } from './scope';

function hashKey(queryKey: readonly unknown[]) {
  try {
    return JSON.stringify(queryKey) ?? String(queryKey);
  } catch {
    return queryKey.map(String).join('|');
  }
}

function hashValue(value: unknown) {
  return hashKey([value]);
}

function defaultInitialDataPredicate<
  TData,
  TCreateInput,
  TUpdateInput,
  TQueryRaw,
  TValue,
  TImport,
  TDeleteInput,
>(
  definition: ResourceDefinition<
    TData,
    TCreateInput,
    TUpdateInput,
    TQueryRaw,
    TValue,
    TImport,
    TDeleteInput
  >,
  state: ResourceQueryContext['state'],
) {
  const defaultPageSize = definition.dataView.urlState?.defaults?.pageSize;
  return state.pagination.pageIndex === 0 &&
    state.search === '' &&
    Object.keys(state.filters).length === 0 &&
    state.sorting.length === 0 &&
    (defaultPageSize === undefined || state.pagination.pageSize === defaultPageSize);
}

export function useResourceQuery<
  TData,
  TCreateInput,
  TUpdateInput,
  TQueryRaw,
  TValue = unknown,
  TImport = Record<string, string>,
  TDeleteInput = string,
>(
  definition: ResourceDefinition<
    TData,
    TCreateInput,
    TUpdateInput,
    TQueryRaw,
    TValue,
    TImport,
    TDeleteInput
  >,
  initialData: TQueryRaw | undefined,
  state: DataViewState,
) {
  const queryDefinition = definition.query;
  const execution = useResourceExecutionContext();
  const scope = definition.scope ?? DEFAULT_RESOURCE_SCOPE;
  const queryStateSignature = hashKey([
    state.search,
    state.filters,
    state.sorting,
    state.pagination,
  ]);
  const queryState = React.useMemo(
    () => selectDataViewQueryState(state),
    [queryStateSignature],
  );
  const queryContext = React.useMemo<ResourceQueryContext>(
    () => ({ state: queryState, ...(execution ? { execution } : {}) }),
    [execution, queryState],
  );
  const scoped = scope === 'scoped';
  const baseQueryKey = queryDefinition?.queryKey(queryContext) ?? [
    'resource',
    definition.metadata.name,
    'disabled',
  ];
  const queryKey = scopeResourceKey(scope, baseQueryKey, execution?.scopeId);
  // Global resources can still be partitioned by an execution identity (for example,
  // a user-owned notification feed). Keep retained placeholder data inside that
  // identity boundary without treating userId as a backend authorization decision.
  const namespace = hashKey([
    scope,
    execution?.scopeId ?? null,
    execution?.userId ?? null,
    definition.metadata.name,
  ]);
  const namespaces = React.useRef(new Map<string, string>());
  namespaces.current.set(hashKey(queryKey), namespace);
  const queryIdentity = hashKey([namespace, queryKey]);
  const initialDataHash = initialData === undefined ? undefined : hashValue(initialData);
  const initialDataIdentity = React.useRef<{
    queryIdentity: string;
    valueHash: string;
  } | null>(null);
  if (
    initialDataHash !== undefined &&
    (initialDataIdentity.current === null ||
      initialDataIdentity.current.valueHash !== initialDataHash)
  ) {
    initialDataIdentity.current = { queryIdentity, valueHash: initialDataHash };
  }
  const initialDataMatchesQuery = initialDataHash !== undefined &&
    initialDataIdentity.current?.queryIdentity === queryIdentity &&
    initialDataIdentity.current.valueHash === initialDataHash;
  const policy = queryDefinition?.policy;
  const canUseInitialData = Boolean(queryDefinition) &&
    (!scoped || Boolean(execution?.scopeId)) &&
    policy?.initialData !== 'never' &&
    (queryDefinition?.useInitialData?.(queryContext) ??
      defaultInitialDataPredicate(definition, queryState));

  return useQuery<TQueryRaw, AppMutationError, ResourceListResult<TData>>({
    queryKey,
    enabled: Boolean(queryDefinition) &&
      (!scoped || Boolean(execution?.scopeId)) &&
      (queryDefinition?.enabled?.(queryContext) ?? true),
    queryFn: async ({ signal }) => {
      if (!queryDefinition) throw new Error(`The ${definition.metadata.name} resource has no query.`);
      try {
        return await queryDefinition.queryFn({ ...queryContext, signal });
      } catch (error) {
        if (signal.aborted || isCancelledError(error)) throw error;
        throw normalizeMutationError(error);
      }
    },
    select: (response) => {
      try {
        const normalized = queryDefinition
          ? queryDefinition.normalize(response)
          : normalizeResourceList<TData>(undefined);
        if (!Array.isArray(normalized.rows)) {
          throw new Error(
            `[Resource:${definition.metadata.name}] query.normalize() must return rows as an array.`,
          );
        }
        return normalized;
      } catch (error) {
        throw normalizeMutationError(error);
      }
    },
    placeholderData: (previous, previousQuery) => {
      if (!previousQuery) return previous;
      return namespaces.current.get(hashKey(previousQuery.queryKey)) === namespace
        ? previous
        : undefined;
    },
    ...(initialData !== undefined && canUseInitialData && initialDataMatchesQuery
      ? { initialData }
      : {}),
    ...(policy?.staleTime !== undefined
      ? { staleTime: policy.staleTime }
      : queryDefinition?.staleTime !== undefined
        ? { staleTime: queryDefinition.staleTime }
        : {}),
    ...(policy?.gcTime !== undefined ? { gcTime: policy.gcTime } : {}),
    ...(policy?.retry !== undefined ? { retry: policy.retry } : {}),
    ...(policy?.refetchOnWindowFocus !== undefined
      ? { refetchOnWindowFocus: policy.refetchOnWindowFocus }
      : {}),
  });
}
