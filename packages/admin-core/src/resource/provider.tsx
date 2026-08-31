'use client';

import { ResourceRuntimeProvider } from './runtime';
import type { ResourceProviderProps } from './contracts';
import { ResourceExecutionContextProvider } from './execution-context';

export function ResourceProvider<TData, TCreateValues = never, TUpdateValues = never, TQueryRaw = import('./contracts').ResourceListResult<TData>>(props: ResourceProviderProps<TData, TCreateValues, TUpdateValues, TQueryRaw>) {
  const { executionContext, ...runtimeProps } = props;
  return <ResourceExecutionContextProvider value={executionContext}><ResourceRuntimeProvider {...runtimeProps} /></ResourceExecutionContextProvider>;
}
