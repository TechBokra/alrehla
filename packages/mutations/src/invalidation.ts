import type { QueryClient, QueryKey } from '@tanstack/react-query';

export type MutationInvalidateConfig<TData, TVariables> =
  | readonly QueryKey[]
  | ((data: TData, variables: TVariables) => readonly QueryKey[]);

export const resolveInvalidationKeys = <TData, TVariables>(
  invalidate: MutationInvalidateConfig<TData, TVariables> | undefined,
  data: TData,
  variables: TVariables,
): readonly QueryKey[] => {
  if (!invalidate) return [];
  return typeof invalidate === 'function' ? invalidate(data, variables) : invalidate;
};

export const invalidateQueryKeys = async (
  queryClient: QueryClient,
  queryKeys: readonly QueryKey[],
): Promise<void> => {
  await Promise.all(
    queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  );
};
