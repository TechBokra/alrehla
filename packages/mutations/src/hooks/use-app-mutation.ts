"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { normalizeActionResult, normalizeMutationError } from "../utils";
import type {
  AppMutationOptions,
  UnwrapMutationResult,
} from "../types/mutation-options";
import type { MutationError } from "../types/mutation-error";

export function useAppMutation<TVariables, TResult, TOnMutateResult = unknown>(
  options: AppMutationOptions<TVariables, TResult, TOnMutateResult>
): UseMutationResult<
  UnwrapMutationResult<TResult>,
  MutationError,
  TVariables,
  TOnMutateResult
> {
  const queryClient = useQueryClient();
  const {
    mutationFn,
    successMessage,
    errorMessage,
    invalidateQueries,
    updateCache,
    onSuccess,
    onError,
    onSettled,
    ...mutationOptions
  } = options;

  const mutationType = options.mutationType || "ACTION";

  return useMutation<
    UnwrapMutationResult<TResult>,
    MutationError,
    TVariables,
    TOnMutateResult
  >({
    ...mutationOptions,
    mutationFn: async (
      variables,
      context
    ): Promise<UnwrapMutationResult<TResult>> => {
      if (typeof window !== "undefined") {
        if (mutationType === "CREATE") {
          console.log("%c[CLIENT CREATE] ➕ Line / Data added:", "color: #16a34a; font-weight: bold;", variables);
        } else if (mutationType === "UPDATE") {
          console.log("%c[CLIENT UPDATE] ✏️ Line / Data updated:", "color: #d97706; font-weight: bold;", variables);
        } else if (mutationType === "DELETE") {
          console.log("%c[CLIENT DELETE] 🗑️ Target deleted:", "color: #dc2626; font-weight: bold;", variables);
        }
      }

      try {
        const result = await mutationFn(variables, context);
        return normalizeActionResult(result);
      } catch (error: unknown) {
        throw normalizeMutationError(error);
      }
    },
    onSuccess: async (data, variables, onMutateResult, context) => {
      if (typeof window !== "undefined") {
        console.log(`%c[CLIENT ${mutationType} SUCCESS] ✅ Result:`, "color: #16a34a; font-weight: bold;", data);
        console.log(data);
      }

      if (updateCache) {
        await updateCache(data, variables, queryClient);
      }

      if (invalidateQueries) {
        const queryKeys =
          typeof invalidateQueries === "function"
            ? await invalidateQueries(data, variables)
            : invalidateQueries;

        await Promise.all(
          queryKeys.map((queryKey) =>
            queryClient.invalidateQueries({ queryKey })
          )
        );
      }

      const message =
        typeof successMessage === "function"
          ? successMessage(data, variables)
          : successMessage;
      if (message) toast.success(message);

      await onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: async (error, variables, onMutateResult, context) => {
      const normalizedError = normalizeMutationError(error);

      if (typeof window !== "undefined") {
        console.error(`%c[CLIENT ${mutationType} ERROR] ❌:`, "color: #dc2626; font-weight: bold;", normalizedError);
      }

      const message =
        typeof errorMessage === "function"
          ? errorMessage(normalizedError, variables)
          : (errorMessage ?? normalizedError.message);
      if (message) toast.error(message);

      await onError?.(normalizedError, variables, onMutateResult, context);
    },
    onSettled: async (data, error, variables, onMutateResult, context) => {
      await onSettled?.(
        data,
        error ? normalizeMutationError(error) : null,
        variables,
        onMutateResult,
        context
      );
    },
  });
}
