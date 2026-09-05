import type {
  AppMutationOptions,
  MaybePromise,
} from "@eng-mohamedelsayed/mutations/types";
import type { MutationFunctionContext } from "@tanstack/react-query";
import type { DataViewHierarchyUpdate } from "../../data-view/contracts";
import type { ResourceCache } from "../cache";
import type { ResourceExecutionContext } from "./resource-query";

export type ResourceMutationExecutionContext = MutationFunctionContext & {
  execution?: ResourceExecutionContext;
  /** Optional caller-provided cancellation signal for custom mutation adapters. */
  signal?: AbortSignal;
};

export type ResourceMutationFunction<TInput, TResult> = (
  input: TInput,
  context: ResourceMutationExecutionContext
) => MaybePromise<TResult>;

export interface ResourceCacheUpdateContext<TResult, TInput> {
  cache: ResourceCache;
  result: TResult;
  input: TInput;
}

/**
 * Existing low-level callback kept for backwards compatibility.
 * @deprecated Prefer the scoped `updateCache({ cache, result, input })` form.
 */
export type LegacyResourceCacheUpdate<TResult, TInput> = (
  result: TResult,
  input: TInput,
  queryClient: import("@tanstack/react-query").QueryClient
) => MaybePromise<unknown>;

/** Scope-bound cache writer accepted by Resource mutations. */
export type ResourceCacheUpdate<TResult, TInput> = (
  context: ResourceCacheUpdateContext<TResult, TInput>
) => MaybePromise<unknown>;

export type ResourceMutationMeta<TInput, TResult = unknown> = Pick<
  AppMutationOptions<TInput, TResult>,
  "mutationKey" | "successMessage" | "errorMessage" | "invalidateQueries"
> & {
  /** Scope-bound cache writer. */
  updateCache?: ResourceCacheUpdate<TResult, TInput>;
  /** @deprecated Prefer `updateCache({ cache, result, input })`. */
  legacyUpdateCache?: LegacyResourceCacheUpdate<TResult, TInput>;
};

export type ResourceMutationDefinition<
  TInput,
  TResult = unknown,
> = ResourceMutationMeta<TInput, TResult> & {
  mutationFn: ResourceMutationFunction<TInput, TResult>;
};

export interface ResourceUpdateMutationDefinition<
  TData,
  TValues,
  TInput,
> extends ResourceMutationDefinition<TInput> {
  getInput: (context: { record: TData; values: TValues }) => TInput;
}

export interface ResourceDeleteMutationDefinition<
  TData,
  TInput,
> extends ResourceMutationDefinition<TInput> {
  getInput: (record: TData) => TInput;
  getLabel?: (record: TData) => string;
}

export interface ResourceDeleteManyMutationDefinition<
  TData,
  TInput,
> extends ResourceMutationDefinition<TInput> {
  getInput: (records: TData[]) => TInput;
  /** Optional adapter for explicit cross-page IDs without loaded records. */
  getInputFromIds?: (ids: string[]) => TInput;
}

export interface ResourceMutationsDefinition<
  TData,
  TCreateInput,
  TUpdateInput,
  TDeleteInput = string,
  TDeleteManyInput = TDeleteInput[],
  TReorderInput = DataViewHierarchyUpdate,
  TImportInput = File,
> {
  create?: ResourceMutationDefinition<TCreateInput>;
  update?: ResourceUpdateMutationDefinition<
    TData,
    TUpdateInput,
    { record: TData; values: TUpdateInput }
  >;
  delete?: ResourceDeleteMutationDefinition<TData, TDeleteInput>;
  deleteMany?: ResourceDeleteManyMutationDefinition<TData, TDeleteManyInput>;
  reorder?: ResourceMutationDefinition<TReorderInput>;
  import?: ResourceMutationDefinition<TImportInput>;
}
