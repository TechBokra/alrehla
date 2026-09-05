"use client";

import type { UseMutationResult } from "@tanstack/react-query";
import { useAppMutation } from "./use-app-mutation";
import type { MutationError } from "../types/mutation-error";
import type {
  AppMutationOptions,
  UnwrapMutationResult,
} from "../types/mutation-options";

export function useUpdateMutation<
  TVariables,
  TResult,
  TOnMutateResult = unknown,
>(
  options: AppMutationOptions<TVariables, TResult, TOnMutateResult>
): UseMutationResult<
  UnwrapMutationResult<TResult>,
  MutationError,
  TVariables,
  TOnMutateResult
> {
  return useAppMutation({ ...options, mutationType: "UPDATE" });
}
