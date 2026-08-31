'use client';

import * as React from 'react';
import type { DataViewCsvRow } from '../data-view/contracts';
import type { ResourceContextValue, ResourceListResult } from './contracts';

type UnknownResourceContext = ResourceContextValue<
  unknown,
  unknown,
  unknown,
  ResourceListResult<unknown>,
  unknown,
  DataViewCsvRow,
  string
>;

export const ResourceContext = React.createContext<UnknownResourceContext | null>(null);

export function useResource<
  TData,
  TCreateValues = unknown,
  TUpdateValues = unknown,
  TQueryRaw = ResourceListResult<TData>,
  TValue = unknown,
  TImport = DataViewCsvRow,
  TDeleteInput = string,
>(): ResourceContextValue<
  TData,
  TCreateValues,
  TUpdateValues,
  TQueryRaw,
  TValue,
  TImport,
  TDeleteInput
> {
  const context = React.useContext(ResourceContext);
  if (!context) throw new Error('Resource components must be rendered inside ResourceProvider.');
  return context as unknown as ResourceContextValue<
    TData,
    TCreateValues,
    TUpdateValues,
    TQueryRaw,
    TValue,
    TImport,
    TDeleteInput
  >;
}

export function useOptionalResource<
  TData,
  TCreateValues = unknown,
  TUpdateValues = unknown,
  TQueryRaw = ResourceListResult<TData>,
  TValue = unknown,
  TImport = DataViewCsvRow,
  TDeleteInput = string,
>(): ResourceContextValue<
  TData,
  TCreateValues,
  TUpdateValues,
  TQueryRaw,
  TValue,
  TImport,
  TDeleteInput
> | null {
  return React.useContext(ResourceContext) as unknown as ResourceContextValue<
    TData,
    TCreateValues,
    TUpdateValues,
    TQueryRaw,
    TValue,
    TImport,
    TDeleteInput
  > | null;
}
