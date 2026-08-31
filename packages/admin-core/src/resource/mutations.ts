'use client';

import {
  createAppMutationError,
  useAppMutation,
  type MutationNotifier,
} from '@alrehla/mutations';
import type { QueryKey } from '@tanstack/react-query';
import type {
  ResourceActions,
  ResourceDefinition,
  ResourceMutationDefinition,
} from './contracts';
import {
  authorizationAllows,
  useResourceAuthorization,
  type ResourceAuthorization,
} from './authorization';
import { createResourceCacheTools } from './cache';
import { createMissingResourceScopeError } from './errors';
import { useResourceExecutionContext } from './execution-context';
import { DEFAULT_RESOURCE_SCOPE, scopeResourceKey, type ResourceScope } from './scope';

function useConfiguredMutation<TInput>(
  resourceName: string,
  operation: string,
  config: ResourceMutationDefinition<TInput> | undefined,
  execution: ReturnType<typeof useResourceExecutionContext>,
  scope: ResourceScope,
  authorization: ResourceAuthorization | undefined,
  requiredPermissions: readonly string[],
  notifier?: MutationNotifier,
) {
  const scopeId = execution?.scopeId;
  const baseMutationKey = config?.mutationKey ?? ['resource', resourceName, operation];
  const mutationKey = scopeResourceKey(scope, baseMutationKey, scopeId);
  const invalidations = config?.invalidateQueries ?? config?.invalidate;
  const scopedInvalidations = invalidations
    ? typeof invalidations === 'function'
      ? (data: unknown, variables: TInput) =>
          invalidations(data, variables).map((key) => scopeResourceKey(scope, key, scopeId))
      : invalidations.map((key) => scopeResourceKey(scope, key, scopeId))
    : undefined;

  return useAppMutation<unknown, TInput>({
    mutationKey,
    mutationFn: async (input, context) => {
      if (!config) throw new Error(`The ${resourceName} resource does not support ${operation}.`);
      if (scope === 'scoped' && !scopeId) throw createMissingResourceScopeError(resourceName);
      if (!requiredPermissions.every((permission) => authorizationAllows(permission, authorization))) {
        throw createAppMutationError({
          message: 'ليست لديك صلاحية لتنفيذ هذا الإجراء.',
          type: 'authorization',
          code: 'RESOURCE_PERMISSION_REQUIRED',
          status: 403,
          details: { resourceName, operation },
        });
      }
      return config.mutationFn(input, {
        ...context,
        ...(execution ? { execution } : {}),
      });
    },
    ...(scopedInvalidations ? { invalidate: scopedInvalidations } : {}),
    ...(config?.successMessage ? { successMessage: config.successMessage } : {}),
    ...(config?.errorMessage ? { errorMessage: config.errorMessage } : {}),
    ...(notifier ? { notifier } : {}),
    ...(config?.updateCache || config?.legacyUpdateCache
      ? {
          updateCache: async (result, input, queryClient) => {
            if (config.updateCache) {
              const firstListKey = Array.isArray(invalidations)
                ? invalidations[0] as QueryKey | undefined
                : undefined;
              await config.updateCache({
                cache: createResourceCacheTools({
                  client: queryClient,
                  scope,
                  ...(scopeId ? { scopeId } : {}),
                  ...(firstListKey ? { listQueryKey: firstListKey } : {}),
                }),
                result,
                input,
              });
              return;
            }
            await config.legacyUpdateCache?.(result, input, queryClient);
          },
        }
      : {}),
  });
}

export function useResourceMutations<
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
  notifier?: MutationNotifier,
) {
  const configured = definition.mutations;
  const execution = useResourceExecutionContext();
  const authorization = useResourceAuthorization();
  const scope = definition.scope ?? DEFAULT_RESOURCE_SCOPE;
  const bulkPermissions = definition.authorization?.bulkActions
    ? Array.isArray(definition.authorization.bulkActions)
      ? definition.authorization.bulkActions
      : [definition.authorization.bulkActions]
    : definition.authorization?.delete
      ? [definition.authorization.delete]
      : [];
  return {
    createMutation: useConfiguredMutation(
      definition.metadata.name,
      'create',
      configured?.create,
      execution,
      scope,
      authorization,
      definition.authorization?.create ? [definition.authorization.create] : [],
      notifier,
    ),
    updateMutation: useConfiguredMutation(
      definition.metadata.name,
      'update',
      configured?.update,
      execution,
      scope,
      authorization,
      definition.authorization?.update ? [definition.authorization.update] : [],
      notifier,
    ),
    deleteMutation: useConfiguredMutation(
      definition.metadata.name,
      'delete',
      configured?.delete,
      execution,
      scope,
      authorization,
      definition.authorization?.delete ? [definition.authorization.delete] : [],
      notifier,
    ),
    deleteManyMutation: useConfiguredMutation(
      definition.metadata.name,
      'deleteMany',
      configured?.deleteMany,
      execution,
      scope,
      authorization,
      bulkPermissions,
      notifier,
    ),
    reorderMutation: useConfiguredMutation(
      definition.metadata.name,
      'reorder',
      configured?.reorder,
      execution,
      scope,
      authorization,
      definition.authorization?.update ? [definition.authorization.update] : [],
      notifier,
    ),
    importMutation: useConfiguredMutation(
      definition.metadata.name,
      'import',
      configured?.import,
      execution,
      scope,
      authorization,
      definition.authorization?.import ? [definition.authorization.import] : [],
      notifier,
    ),
  };
}

export function createResourceActions<
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
  mutations: ReturnType<
    typeof useResourceMutations<
      TData,
      TCreateInput,
      TUpdateInput,
      TQueryRaw,
      TValue,
      TImport,
      TDeleteInput
    >
  >,
): ResourceActions<TData, TCreateInput, TUpdateInput> {
  const configured = definition.mutations;
  const deleteManyByIds = async (ids: string[], loadedRows: TData[]) => {
    const removeMany = configured?.deleteMany;
    if (removeMany) {
      if (removeMany.getInputFromIds) {
        return mutations.deleteManyMutation.mutateAsync(removeMany.getInputFromIds(ids));
      }
      if (loadedRows.length !== ids.length) {
        throw new Error(
          `The ${definition.metadata.name} resource requires getInputFromIds for cross-page deletion.`,
        );
      }
      return mutations.deleteManyMutation.mutateAsync(removeMany.getInput(loadedRows));
    }
    const remove = configured?.delete;
    if (definition.bulkDelete?.strategy === 'individual' && remove) {
      const rowsById = new Map(
        loadedRows.map((row) => [definition.dataView.getRowId(row), row]),
      );
      for (const id of ids) {
        const row = rowsById.get(id);
        if (!row) {
          throw new Error(
            'Individual bulk deletion requires every selected row to be loaded.',
          );
        }
        await mutations.deleteMutation.mutateAsync(remove.getInput(row));
      }
      return;
    }
    throw new Error('This resource does not support bulk deletion.');
  };

  return {
    create: (values) => mutations.createMutation.mutateAsync(values),
    update: (record, values) => {
      const update = configured?.update;
      return update
        ? mutations.updateMutation.mutateAsync(update.getInput({ record, values }))
        : Promise.reject(new Error('This resource cannot be updated.'));
    },
    delete: (record) => {
      const remove = configured?.delete;
      return remove
        ? mutations.deleteMutation.mutateAsync(remove.getInput(record))
        : Promise.reject(new Error('This resource cannot be deleted.'));
    },
    deleteManyByIds,
    deleteMany: async (records) => {
      const ids = records.map(definition.dataView.getRowId);
      return deleteManyByIds(ids, records);
    },
    reorder: (input) => mutations.reorderMutation.mutateAsync(input),
    import: (file) => mutations.importMutation.mutateAsync(file),
  };
}
