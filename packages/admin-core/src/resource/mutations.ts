'use client';

import { useAppMutation, type MutationNotifier } from '@alrehla/mutations';
import type { ResourceActions, ResourceDefinition } from './contracts';

function useConfiguredMutation<TInput, TResult>(resourceName: string, operation: string, config: { mutationFn: (input: TInput) => Promise<TResult> | TResult; mutationKey?: readonly unknown[]; invalidate?: unknown; successMessage?: string; errorMessage?: string } | undefined, notifier?: MutationNotifier) {
  return useAppMutation<TResult, TInput>({
    mutationKey: config?.mutationKey ?? ['resource', resourceName, operation],
    mutationFn: async (input) => {
      if (!config) throw new Error(`The ${resourceName} resource does not support ${operation}.`);
      return config.mutationFn(input);
    },
    ...(config?.invalidate !== undefined ? { invalidate: config.invalidate as never } : {}),
    ...(config?.successMessage ? { successMessage: config.successMessage } : {}),
    ...(config?.errorMessage ? { errorMessage: config.errorMessage } : {}),
    ...(notifier ? { notifier } : {}),
  });
}

export function useResourceMutations<TData, TCreateValues, TUpdateValues, TQueryRaw>(definition: ResourceDefinition<TData, TCreateValues, TUpdateValues, TQueryRaw>, notifier?: MutationNotifier) {
  return {
    create: useConfiguredMutation(definition.metadata.name, 'create', definition.mutations?.create, notifier),
    update: useConfiguredMutation(definition.metadata.name, 'update', definition.mutations?.update, notifier),
    delete: useConfiguredMutation(definition.metadata.name, 'delete', definition.mutations?.delete, notifier),
    deleteMany: useConfiguredMutation(definition.metadata.name, 'deleteMany', definition.mutations?.deleteMany, notifier),
  };
}

export function createResourceActions<TData, TCreateValues, TUpdateValues, TQueryRaw>(definition: ResourceDefinition<TData, TCreateValues, TUpdateValues, TQueryRaw>, mutations: ReturnType<typeof useResourceMutations<TData, TCreateValues, TUpdateValues, TQueryRaw>>): ResourceActions<TData, TCreateValues, TUpdateValues> {
  return {
    create: (values) => mutations.create.mutateAsync(values),
    update: (record, values) => { const config = definition.mutations?.update; return config ? mutations.update.mutateAsync(config.getInput({ record, values })) : Promise.reject(new Error('This resource cannot be updated.')); },
    delete: (record) => { const config = definition.mutations?.delete; return config ? mutations.delete.mutateAsync(config.getInput(record)) : Promise.reject(new Error('This resource cannot be deleted.')); },
    deleteMany: async (records) => {
      const many = definition.mutations?.deleteMany;
      if (many) { await mutations.deleteMany.mutateAsync(many.getInput(records)); return; }
      const single = definition.mutations?.delete;
      if (definition.bulkDelete?.strategy === 'individual' && single) { for (const record of records) await mutations.delete.mutateAsync(single.getInput(record)); return; }
      throw new Error('This resource does not support bulk deletion.');
    },
  };
}
