import type {
  MutationFunctionContext,
  QueryClient,
  QueryKey,
} from '@tanstack/react-query';
import type { DataViewHierarchyUpdate } from '../../data-view/contracts';
import type { ResourceCache } from '../cache';
import type { ResourceExecutionContext } from '../execution-context';

export type MaybePromise<T> = T | Promise<T>;

export type ResourceMutationExecutionContext = MutationFunctionContext & {
  execution?: ResourceExecutionContext;
  signal?: AbortSignal;
};

export type ResourceMutationFunction<TInput, TResult> = (
  input: TInput,
  context: ResourceMutationExecutionContext,
) => MaybePromise<TResult>;

export interface ResourceCacheUpdateContext<TResult, TInput> {
  cache: ResourceCache;
  result: TResult;
  input: TInput;
}

export type ResourceCacheUpdate<TResult, TInput> = (
  context: ResourceCacheUpdateContext<TResult, TInput>,
) => MaybePromise<unknown>;

/** @deprecated Use the scope-bound updateCache callback. */
export type LegacyResourceCacheUpdate<TResult, TInput> = (
  result: TResult,
  input: TInput,
  queryClient: QueryClient,
) => MaybePromise<unknown>;

export interface ResourceMutationMeta<TInput, TResult = unknown> {
  mutationKey?: readonly unknown[];
  successMessage?: string;
  errorMessage?: string;
  invalidateQueries?: readonly QueryKey[] | ((data: TResult, variables: TInput) => readonly QueryKey[]);
  updateCache?: ResourceCacheUpdate<TResult, TInput>;
}

export interface ResourceMutationDefinition<TInput, TResult = unknown>
  extends ResourceMutationMeta<TInput, TResult> {
  mutationFn: ResourceMutationFunction<TInput, TResult>;
  mutationKey?: readonly unknown[];
  invalidate?: readonly QueryKey[] | ((data: TResult, variables: TInput) => readonly QueryKey[]);
  invalidateQueries?: readonly QueryKey[] | ((data: TResult, variables: TInput) => readonly QueryKey[]);
  successMessage?: string;
  errorMessage?: string;
  updateCache?: ResourceCacheUpdate<TResult, TInput>;
  legacyUpdateCache?: LegacyResourceCacheUpdate<TResult, TInput>;
}

export interface ResourceUpdateMutationDefinition<TData, TValues, TInput, TResult = unknown>
  extends ResourceMutationDefinition<TInput, TResult> {
  getInput(context: { record: TData; values: TValues }): TInput;
}

export interface ResourceDeleteMutationDefinition<TData, TInput, TResult = unknown>
  extends ResourceMutationDefinition<TInput, TResult> {
  getInput(record: TData): TInput;
  getLabel?: (record: TData) => string;
}

export interface ResourceDeleteManyMutationDefinition<TData, TInput, TResult = unknown>
  extends ResourceMutationDefinition<TInput, TResult> {
  getInput(records: TData[]): TInput;
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
  custom?: Readonly<Record<string, ResourceMutationDefinition<unknown>>>;
}
