"use client";

import { useAppMutation } from "@eng-mohamedelsayed/mutations";
import { AppError } from "@eng-mohamedelsayed/mutations/types";
import type { AppMutationOptions } from "@eng-mohamedelsayed/mutations/types";
import type {
  ResourceActions,
  ResourceDefinition,
  ResourceMutationDefinition,
} from "./contracts";
import { useResourceExecutionContext } from "./execution-context";
import { DEFAULT_RESOURCE_SCOPE, scopeResourceKey } from "./scope";
import {
  authorizationAllows,
  useResourceAuthorization,
  type ResourceAuthorization,
} from "./authorization";
import { createResourceCacheTools } from "./cache";
import type {
  LegacyResourceCacheUpdate,
  ResourceCacheUpdate,
} from "./contracts/resource-mutation";

function useConfiguredMutation<TInput>(
  resourceName: string,
  operation: string,
  config: ResourceMutationDefinition<TInput> | undefined,
  execution: ReturnType<typeof useResourceExecutionContext>,
  scope: "store" | "global",
  authorization: ResourceAuthorization | undefined,
  requiredPermissions: readonly string[] = []
) {
  const storeId = execution?.storeId;
  const baseMutationKey = config?.mutationKey ?? [
    "resource",
    resourceName,
    operation,
  ];
  const mutationKey = scopeResourceKey(scope, baseMutationKey, storeId);
  const invalidateQueries = config?.invalidateQueries;
  const scopedInvalidations = invalidateQueries
    ? typeof invalidateQueries === "function"
      ? async (data: unknown, variables: TInput) =>
          (await invalidateQueries(data, variables)).map((queryKey) =>
            scopeResourceKey(scope, queryKey, storeId)
          )
      : invalidateQueries.map((queryKey) =>
          scopeResourceKey(scope, queryKey, storeId)
        )
    : undefined;

  const options: AppMutationOptions<TInput, unknown> = {
    mutationKey,
    mutationFn: async (input, context) => {
      if (!config) {
        throw new Error(
          `The ${resourceName} resource does not support ${operation}.`
        );
      }
      if (scope === "store" && !storeId) {
        throw new AppError(
          "A trusted Store context is required for this mutation.",
          {
            code: "STORE_CONTEXT_REQUIRED",
            type: "authorization",
            status: 403,
          }
        );
      }
      if (
        !requiredPermissions.every((permission) =>
          authorizationAllows(permission, authorization)
        )
      ) {
        throw new AppError(
          "You do not have permission to perform this Store operation.",
          {
            code: "STORE_PERMISSION_REQUIRED",
            type: "authorization",
            status: 403,
          }
        );
      }
      return config.mutationFn(input, {
        ...context,
        ...(execution ? { execution } : {}),
      });
    },
    ...(config?.successMessage !== undefined
      ? { successMessage: config.successMessage }
      : {}),
    ...(config?.errorMessage !== undefined
      ? { errorMessage: config.errorMessage }
      : {}),
    ...(scopedInvalidations !== undefined
      ? { invalidateQueries: scopedInvalidations }
      : {}),
    ...(config?.updateCache !== undefined ||
    config?.legacyUpdateCache !== undefined
      ? {
          updateCache: async (result, input, queryClient) => {
            if (config.updateCache) {
              return (
                config.updateCache as ResourceCacheUpdate<unknown, TInput>
              )({
                cache: createResourceCacheTools({
                  client: queryClient,
                  scope,
                  ...(storeId ? { storeId } : {}),
                  ...(Array.isArray(invalidateQueries) && invalidateQueries[0]
                    ? { listQueryKey: invalidateQueries[0] }
                    : {}),
                }),
                result,
                input,
              });
            }
            return (
              config.legacyUpdateCache as LegacyResourceCacheUpdate<
                unknown,
                TInput
              >
            )(result, input, queryClient);
          },
        }
      : {}),
  };
  return useAppMutation<TInput, unknown>(options);
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
  >
) {
  const mutations = definition.mutations;
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
      "create",
      mutations?.create,
      execution,
      scope,
      authorization,
      definition.authorization?.create ? [definition.authorization.create] : []
    ),
    updateMutation: useConfiguredMutation(
      definition.metadata.name,
      "update",
      mutations?.update,
      execution,
      scope,
      authorization,
      definition.authorization?.update ? [definition.authorization.update] : []
    ),
    deleteMutation: useConfiguredMutation(
      definition.metadata.name,
      "delete",
      mutations?.delete,
      execution,
      scope,
      authorization,
      definition.authorization?.delete ? [definition.authorization.delete] : []
    ),
    deleteManyMutation: useConfiguredMutation(
      definition.metadata.name,
      "deleteMany",
      mutations?.deleteMany,
      execution,
      scope,
      authorization,
      bulkPermissions
    ),
    reorderMutation: useConfiguredMutation(
      definition.metadata.name,
      "reorder",
      mutations?.reorder,
      execution,
      scope,
      authorization,
      definition.authorization?.update ? [definition.authorization.update] : []
    ),
    importMutation: useConfiguredMutation(
      definition.metadata.name,
      "import",
      mutations?.import,
      execution,
      scope,
      authorization,
      definition.authorization?.import ? [definition.authorization.import] : []
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
  >
): ResourceActions<TData, TCreateInput, TUpdateInput> {
  const configured = definition.mutations;
  return {
    create: (values) => mutations.createMutation.mutateAsync(values),
    update: (record, values) => {
      const update = configured?.update;
      if (!update)
        return Promise.reject(new Error("This resource cannot be updated."));
      return mutations.updateMutation.mutateAsync(
        update.getInput({ record, values })
      );
    },
    delete: (record) => {
      const remove = configured?.delete;
      if (!remove)
        return Promise.reject(new Error("This resource cannot be deleted."));
      return mutations.deleteMutation.mutateAsync(remove.getInput(record));
    },
    deleteManyByIds: async (ids, loadedRows) => {
      const removeMany = configured?.deleteMany;
      if (removeMany) {
        if (removeMany.getInputFromIds) {
          return mutations.deleteManyMutation.mutateAsync(
            removeMany.getInputFromIds(ids)
          );
          return;
        }
        if (loadedRows.length !== ids.length) {
          throw new Error(
            `The ${definition.metadata.name} bulk delete requires an ID-native adapter when selections span pages.`
          );
        }
        return mutations.deleteManyMutation.mutateAsync(
          removeMany.getInput(loadedRows)
        );
        return;
      }

      const remove = configured?.delete;
      if (definition.bulkDelete?.strategy === "individual" && remove) {
        const byId = new Map(
          loadedRows.map((record) => [
            definition.dataView.getRowId(record),
            record,
          ])
        );
        for (const id of ids) {
          const record = byId.get(id);
          if (!record) {
            throw new Error(
              `The ${definition.metadata.name} bulk delete requires loaded rows for individual deletion.`
            );
          }
          await mutations.deleteMutation.mutateAsync(remove.getInput(record));
        }
        return;
      }

      throw new Error(
        `The ${definition.metadata.name} resource does not support bulk delete.`
      );
    },
    deleteMany: async (records) => {
      const removeMany = configured?.deleteMany;
      if (removeMany) {
        await mutations.deleteManyMutation.mutateAsync(
          removeMany.getInput(records)
        );
        return;
      }
      const remove = configured?.delete;
      if (definition.bulkDelete?.strategy === "individual" && remove) {
        for (const record of records) {
          await mutations.deleteMutation.mutateAsync(remove.getInput(record));
        }
        return;
      }
      throw new Error(
        `The ${definition.metadata.name} resource does not support bulk delete.`
      );
    },
    reorder: (input) => mutations.reorderMutation.mutateAsync(input),
    import: (file) => mutations.importMutation.mutateAsync(file),
  };
}
