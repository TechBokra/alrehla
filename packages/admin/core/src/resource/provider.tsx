"use client";

import { ResourceRuntimeProvider } from "./runtime";
import type { ResourceProviderProps, ResourceListResult } from "./contracts";

/**
 * ResourceProvider is the public entry point for the query-backed runtime.
 * Data and mutation adapters are defined by the Resource itself.
 */
export function ResourceProvider<
  TData,
  TCreateInput = unknown,
  TUpdateInput = unknown,
  TQueryRaw = ResourceListResult<TData>,
  TValue = unknown,
  TImport = Record<string, string>,
  TDeleteInput = string,
>(
  props: ResourceProviderProps<
    TData,
    TCreateInput,
    TUpdateInput,
    TQueryRaw,
    TValue,
    TImport,
    TDeleteInput
  >
) {
  return <ResourceRuntimeProvider {...props} />;
}
