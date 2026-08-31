'use client';

import { ResourceRuntimeProvider } from './runtime';
import type { ResourceListResult, ResourceProviderProps } from './contracts';
import { ResourceExecutionContextProvider } from './execution-context';

export function ResourceProvider<
  TData,
  TCreateValues = unknown,
  TUpdateValues = unknown,
  TQueryRaw = ResourceListResult<TData>,
  TValue = unknown,
  TImport = Record<string, string>,
  TDeleteInput = string,
>(
  props: ResourceProviderProps<
    TData,
    TCreateValues,
    TUpdateValues,
    TQueryRaw,
    TValue,
    TImport,
    TDeleteInput
  >,
) {
  const { executionContext, ...runtimeProps } = props;
  const runtime = <ResourceRuntimeProvider {...runtimeProps} />;
  return executionContext === undefined ? runtime : (
    <ResourceExecutionContextProvider value={executionContext}>
      {runtime}
    </ResourceExecutionContextProvider>
  );
}
