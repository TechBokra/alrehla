import type { DataViewState, ResourceSelection } from '../data-view/contracts';
import { createResourceSelection } from '../data-view/state';
import { authorizationPermissions, type ResourceAuthorization } from '../resource/authorization';
import { createResourceCacheTools, type ResourceCacheTools } from '../resource/cache';
import type { ResourceDefinition, ResourceListResult } from '../resource/contracts';
import { resolveResourceCapabilities, type ResolvedResourceCapabilities } from '../resource/contracts';
import { DEFAULT_RESOURCE_SCOPE, scopeResourceKey } from '../resource/scope';
import type { QueryClient } from '@tanstack/react-query';

/**
 * A small framework-neutral contract snapshot used by application test suites.
 * It intentionally reports only orchestration contracts; business rules remain
 * in feature adapters and backend procedures.
 */
export interface ResourceContractSnapshot<TData> {
  queryKey: readonly unknown[];
  mutationKey(operation: string): readonly unknown[];
  selection: ResourceSelection;
  capabilities: ResolvedResourceCapabilities;
  permissions: string[];
  cache: ResourceCacheTools<TData>;
}

export function createResourceContractSnapshot<
  TData,
  TCreateInput = unknown,
  TUpdateInput = unknown,
  TQueryRaw = ResourceListResult<TData>,
  TValue = unknown,
  TImport = Record<string, string>,
  TDeleteInput = string,
>(options: {
  definition: ResourceDefinition<
    TData,
    TCreateInput,
    TUpdateInput,
    TQueryRaw,
    TValue,
    TImport,
    TDeleteInput
  >;
  state: DataViewState;
  queryClient: QueryClient;
  scopeId?: string;
  authorization?: ResourceAuthorization;
}): ResourceContractSnapshot<TData> {
  const { definition, state, queryClient, scopeId, authorization } = options;
  const scope = definition.scope ?? DEFAULT_RESOURCE_SCOPE;
  const queryKey = scopeResourceKey(
    scope,
    definition.query?.queryKey({ state, ...(scopeId ? { execution: { scopeId } } : {}) }) ??
      ['resource', definition.metadata.name, 'disabled'],
    scopeId,
  );
  const baseMutationKey = (operation: string) => [
    'resource',
    definition.metadata.name,
    operation,
  ];
  return {
    queryKey,
    mutationKey: (operation) => scopeResourceKey(scope, baseMutationKey(operation), scopeId),
    selection: createResourceSelection(state.rowSelection),
    capabilities: resolveResourceCapabilities(definition, {}, authorization),
    permissions: authorizationPermissions(definition.authorization),
    cache: createResourceCacheTools({
      client: queryClient,
      scope,
      ...(scopeId ? { scopeId } : {}),
      listQueryKey: queryKey,
    }),
  };
}
