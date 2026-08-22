"use client";

import {
  useMutation,
  useQueryClient,
  type MutationKey,
  type MutationMeta,
} from '@tanstack/react-query';
import { normalizeMutationError, type AppMutationError } from './errors';
import {
  invalidateQueryKeys,
  resolveInvalidationKeys,
  type MutationInvalidateConfig,
} from './invalidation';

export interface MutationNotifier {
  success: (message: string) => void;
  error: (message: string) => void;
}

export interface AppMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData> | TData;
  invalidate?: MutationInvalidateConfig<TData, TVariables>;
  mutationKey?: MutationKey;
  meta?: MutationMeta;
  successMessage?: string;
  errorMessage?: string;
  notifier?: MutationNotifier;
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  onError?: (error: AppMutationError, variables: TVariables) => void | Promise<void>;
  onSettled?: (
    data: TData | undefined,
    error: AppMutationError | null,
    variables: TVariables,
  ) => void | Promise<void>;
}

/**
 * Standard mutations run in this order: mutation function, targeted invalidation,
 * optional success notification, then the feature's success callback. Errors are
 * normalized before an optional error notification and feature error callback.
 */
export const useAppMutation = <TData, TVariables = void>(
  options: AppMutationOptions<TData, TVariables>,
) => {
  const queryClient = useQueryClient();
  const {
    errorMessage,
    invalidate,
    meta,
    mutationFn,
    mutationKey,
    notifier,
    onError,
    onSettled,
    onSuccess,
    successMessage,
  } = options;

  return useMutation<TData, AppMutationError, TVariables>({
    meta,
    mutationKey,
    mutationFn: async (variables) => {
      try {
        return await mutationFn(variables);
      } catch (error) {
        throw normalizeMutationError(error, { fallbackMessage: errorMessage });
      }
    },
    onError: async (error, variables) => {
      notifier?.error(error.message);
      await onError?.(error, variables);
    },
    onSettled: async (data, error, variables) => {
      await onSettled?.(data, error, variables);
    },
    onSuccess: async (data, variables) => {
      await invalidateQueryKeys(
        queryClient,
        resolveInvalidationKeys(invalidate, data, variables),
      );

      if (successMessage) notifier?.success(successMessage);
      await onSuccess?.(data, variables);
    },
  });
};
