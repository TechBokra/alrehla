import type {
  MutationFunctionContext,
  MutationKey,
  UseMutationOptions,
  QueryKey,
} from "@tanstack/react-query";
import type { ActionResult } from "./action-result";
import type { MutationError } from "./mutation-error";

export type MaybePromise<T> = T | Promise<T>;

export type MutationResponse<TData> = TData | ActionResult<TData>;

export type AppMutationFunction<TVariables, TResult> = (
  variables: TVariables,
  context: MutationFunctionContext
) => MaybePromise<TResult>;

export type UnwrapMutationResult<TResult> =
  Awaited<TResult> extends ActionResult<infer TData> ? TData : Awaited<TResult>;

export type MutationMessage<TData, TVariables> =
  string | ((data: TData, variables: TVariables) => string | undefined);

export type MutationErrorMessage<TVariables> =
  | string
  | ((error: MutationError, variables: TVariables) => string | undefined);

export type InvalidateQueries<TData, TVariables> =
  | readonly QueryKey[]
  | ((data: TData, variables: TVariables) => MaybePromise<readonly QueryKey[]>);

export interface AppMutationCallbacks<TData, TVariables, TOnMutateResult> {
  onSuccess?: (
    data: TData,
    variables: TVariables,
    onMutateResult: TOnMutateResult,
    context: MutationFunctionContext
  ) => MaybePromise<unknown>;
  onError?: (
    error: MutationError,
    variables: TVariables,
    onMutateResult: TOnMutateResult | undefined,
    context: MutationFunctionContext
  ) => MaybePromise<unknown>;
  onSettled?: (
    data: TData | undefined,
    error: MutationError | null,
    variables: TVariables,
    onMutateResult: TOnMutateResult | undefined,
    context: MutationFunctionContext
  ) => MaybePromise<unknown>;
}

export type AppMutationOptions<
  TVariables,
  TResult,
  TOnMutateResult = unknown,
> = Omit<
  UseMutationOptions<
    UnwrapMutationResult<TResult>,
    MutationError,
    TVariables,
    TOnMutateResult
  >,
  "mutationFn" | "onSuccess" | "onError" | "onSettled"
> &
  AppMutationCallbacks<
    UnwrapMutationResult<TResult>,
    TVariables,
    TOnMutateResult
  > & {
    mutationFn: AppMutationFunction<TVariables, TResult>;
    successMessage?: MutationMessage<UnwrapMutationResult<TResult>, TVariables>;
    errorMessage?: MutationErrorMessage<TVariables>;
    invalidateQueries?: InvalidateQueries<
      UnwrapMutationResult<TResult>,
      TVariables
    >;
    updateCache?: (
      data: UnwrapMutationResult<TResult>,
      variables: TVariables,
      queryClient: import("@tanstack/react-query").QueryClient
    ) => MaybePromise<unknown>;
    mutationKey?: MutationKey | undefined;
    mutationType?: "CREATE" | "UPDATE" | "DELETE" | "ACTION" | undefined;
    name?: string | undefined;
  };
