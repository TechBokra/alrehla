import type { QueryKey } from '@tanstack/react-query';

export interface ResourceMutationDefinition<TInput, TResult = unknown> {
  mutationFn: (input: TInput) => Promise<TResult> | TResult;
  mutationKey?: readonly unknown[];
  invalidate?: readonly QueryKey[] | ((data: TResult, variables: TInput) => readonly QueryKey[]);
  successMessage?: string;
  errorMessage?: string;
}

export interface ResourceUpdateMutationDefinition<TData, TValues, TResult = unknown> extends ResourceMutationDefinition<{ record: TData; values: TValues }, TResult> {
  getInput: (context: { record: TData; values: TValues }) => { record: TData; values: TValues };
}

export interface ResourceDeleteMutationDefinition<TData, TResult = unknown> extends ResourceMutationDefinition<string, TResult> {
  getInput: (record: TData) => string;
  getLabel?: (record: TData) => string;
}

export interface ResourceDeleteManyMutationDefinition<TData, TResult = unknown> extends ResourceMutationDefinition<string[], TResult> {
  getInput: (records: TData[]) => string[];
}

export interface ResourceMutationsDefinition<TData, TCreateValues, TUpdateValues, TResult = unknown> {
  create?: ResourceMutationDefinition<TCreateValues, TResult>;
  update?: ResourceUpdateMutationDefinition<TData, TUpdateValues, TResult>;
  delete?: ResourceDeleteMutationDefinition<TData, TResult>;
  deleteMany?: ResourceDeleteManyMutationDefinition<TData, TResult>;
}
