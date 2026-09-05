"use client";

import * as React from "react";
import { isCancelledError, useQuery } from "@tanstack/react-query";
import { normalizeAppError } from "@eng-mohamedelsayed/mutations/utils";
import type { AppError } from "@eng-mohamedelsayed/mutations/types";
import type {
  ResourceDefinition,
  ResourceListResult,
  ResourceQueryContext,
} from "./contracts";
import { normalizeResourceList } from "./contracts";
import { useResourceExecutionContext } from "./execution-context";
import { DEFAULT_RESOURCE_SCOPE, scopeResourceKey } from "./scope";
import {
  getDataViewTableState,
  getDataViewViewState,
} from "../data-view/state";
import { resolveAuthorizedResourceViews, useResourceAuthorization } from "./authorization";

function hashResourceQueryKey(queryKey: readonly unknown[]): string {
  try {
    return JSON.stringify(queryKey) ?? String(queryKey);
  } catch {
    return queryKey.map((part) => String(part)).join("|");
  }
}

export function defaultInitialDataPredicate<
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
  context: ResourceQueryContext
) {
  if (!context.view || context.view.type !== "table") return false;
  const defaultPageSize = definition.dataView.urlState?.defaults?.pageSize;
  const tableState = getDataViewTableState(context.state);
  return (
    tableState.pagination.pageIndex === 0 &&
    context.state.search === "" &&
    Object.keys(context.state.filters).length === 0 &&
    context.state.sorting.length === 0 &&
    (defaultPageSize === undefined ||
      tableState.pagination.pageSize === defaultPageSize)
  );
}

/** Owns the Resource-to-TanStack Query lifecycle and result normalization. */
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
  state: ResourceQueryContext["state"]
) {
  const queryDefinition = definition.query;
  const execution = useResourceExecutionContext();
  const authorization = useResourceAuthorization();
  const scope = definition.scope ?? DEFAULT_RESOURCE_SCOPE;
  const viewResolution = resolveAuthorizedResourceViews(
    definition,
    state.activeView,
    authorization
  );
  const resolvedView = viewResolution.view;
  const hasStoreContext = !(
    scope === "store" && !execution?.storeId
  );
  const queryEnabled =
    Boolean(queryDefinition) && hasStoreContext && resolvedView !== null;
  const queryContext = React.useMemo<ResourceQueryContext>(
    () => {
      return {
        state,
        view: resolvedView
          ? {
              id: resolvedView.id,
              type: resolvedView.type,
              config: resolvedView.config ?? {},
              state: getDataViewViewState(state, resolvedView.id),
            }
          : null,
        ...(execution ? { execution } : {}),
      };
    },
    [execution, resolvedView, state]
  );
  const isStoreScoped = scope === "store";
  const baseQueryKey =
    queryDefinition && queryEnabled
      ? queryDefinition.queryKey(queryContext)
      : ["resource", definition.metadata.name, "disabled"];
  const queryKey = scopeResourceKey(scope, baseQueryKey, execution?.storeId);
  const queryIdentity = hashResourceQueryKey(queryKey);
  const resourceNamespace = hashResourceQueryKey([
    scope,
    execution?.storeId ?? null,
    definition.metadata.name,
  ]);
  const queryNamespace = hashResourceQueryKey([
    resourceNamespace,
    resolvedView?.id ?? null,
    resolvedView?.type ?? null,
  ]);
  const knownQueryNamespacesRef = React.useRef(new Map<string, string>());
  if (!knownQueryNamespacesRef.current.has(queryIdentity)) {
    knownQueryNamespacesRef.current.set(queryIdentity, queryNamespace);
  }
  const scopedQueryIdentity = hashResourceQueryKey([
    queryNamespace,
    queryIdentity,
  ]);
  const policy = queryDefinition?.policy;
  const useInitialData =
    Boolean(queryDefinition) &&
    (!isStoreScoped || Boolean(execution?.storeId)) &&
    policy?.initialData !== "never" &&
    queryContext.view !== null &&
    (queryDefinition?.useInitialData?.(queryContext) ??
      defaultInitialDataPredicate(definition, queryContext));
  const initialDataIdentityRef = React.useRef<{
    queryIdentity: string;
    valueHash: string;
  } | null>(null);
  const initialDataHash =
    initialData === undefined ? undefined : hashResourceQueryKey([initialData]);
  if (
    initialDataHash !== undefined &&
    useInitialData &&
    (initialDataIdentityRef.current === null ||
      initialDataIdentityRef.current.valueHash !== initialDataHash)
  ) {
    initialDataIdentityRef.current = {
      queryIdentity: scopedQueryIdentity,
      valueHash: initialDataHash,
    };
  }
  const initialDataMatchesQuery =
    initialDataHash !== undefined &&
    initialDataIdentityRef.current?.queryIdentity === scopedQueryIdentity &&
    initialDataIdentityRef.current.valueHash === initialDataHash;
  return useQuery<TQueryRaw, AppError, ResourceListResult<TData>>({
    queryKey,
    enabled:
      queryEnabled,
    queryFn: async ({ signal }) => {
      if (!queryDefinition) {
        throw normalizeAppError(
          new Error(`The ${definition.metadata.name} resource has no query.`)
        );
      }
      if (isStoreScoped && !execution?.storeId) {
        throw normalizeAppError(
          new Error(
            `The ${definition.metadata.name} resource requires a Store context.`
          )
        );
      }
      if (!queryContext.view || !resolvedView) {
        throw normalizeAppError(
          new Error(
            `The ${definition.metadata.name} resource has no authorized active view.`
          )
        );
      }
      try {
        return await queryDefinition.queryFn({ ...queryContext, signal });
      } catch (error: unknown) {
        // Preserve cancellation semantics so TanStack Query can revert the
        // observer to its previous state instead of surfacing cancellation as
        // an application error. Transport AbortErrors are delivered after the
        // query signal has been aborted, while TanStack may also throw its own
        // CancelledError when cancellation is requested directly.
        if (signal.aborted || isCancelledError(error)) throw error;
        throw normalizeAppError(error);
      }
    },
    select: (response) => {
      try {
        const normalized = queryDefinition
          ? queryDefinition.normalize(response)
          : normalizeResourceList<TData>(undefined);
        if (
          process.env.NODE_ENV !== "production" &&
          !Array.isArray(normalized.rows)
        ) {
          throw new Error(
            `[Resource:${definition.metadata.name}] query.normalize() must return rows as an array`
          );
        }
        return normalized;
      } catch (error: unknown) {
        throw normalizeAppError(error);
      }
    },
    placeholderData: (previous, previousQuery) => {
      if (!previousQuery) return previous;
      const previousNamespace = knownQueryNamespacesRef.current.get(
        hashResourceQueryKey(previousQuery.queryKey)
      );
      return previousNamespace === queryNamespace ? previous : undefined;
    },
    // Leaving initialDataUpdatedAt unset makes TanStack Query timestamp server data now.
    // The QueryClient staleTime (30s in the dashboard) then controls freshness.
    ...(initialData !== undefined && initialDataMatchesQuery && useInitialData
      ? { initialData }
      : {}),
    ...(policy?.staleTime !== undefined ? { staleTime: policy.staleTime } : {}),
    ...(policy?.gcTime !== undefined ? { gcTime: policy.gcTime } : {}),
    ...(policy?.retry !== undefined ? { retry: policy.retry } : {}),
    ...(policy?.refetchOnWindowFocus !== undefined
      ? { refetchOnWindowFocus: policy.refetchOnWindowFocus }
      : {}),
  });
}
