'use client';

import * as React from 'react';
import { ResourceProvider } from '@alrehla/admin-core/resource';
import type {
  ResourceDefinition,
  ResourceListResult,
  ResourceProviderProps,
} from '@alrehla/admin-core/resource';
import { cn } from '../../lib/utils';
import { DataViewPresentationProvider } from '../data-view/presentation-provider';

export interface ResourcePageProps<
  TData = unknown,
  TCreateValues = unknown,
  TUpdateValues = unknown,
  TQueryRaw = ResourceListResult<TData>,
  TValue = unknown,
  TImport = Record<string, string>,
  TDeleteInput = string,
> extends Omit<
    ResourceProviderProps<
      TData,
      TCreateValues,
      TUpdateValues,
      TQueryRaw,
      TValue,
      TImport,
      TDeleteInput
    >,
    'children' | 'definition'
  > {
  resource: ResourceDefinition<
    TData,
    TCreateValues,
    TUpdateValues,
    TQueryRaw,
    TValue,
    TImport,
    TDeleteInput
  >;
  children: React.ReactNode;
  className?: string;
}

export function ResourcePage<
  TData,
  TCreateValues = unknown,
  TUpdateValues = unknown,
  TQueryRaw = ResourceListResult<TData>,
  TValue = unknown,
  TImport = Record<string, string>,
  TDeleteInput = string,
>({ resource, children, className, ...providerProps }: ResourcePageProps<
  TData,
  TCreateValues,
  TUpdateValues,
  TQueryRaw,
  TValue,
  TImport,
  TDeleteInput
>) {
  return (
    <ResourceProvider definition={resource} {...providerProps}>
      <DataViewPresentationProvider>
        <div className={cn('mx-auto w-full max-w-7xl space-y-6', className)}>{children}</div>
      </DataViewPresentationProvider>
    </ResourceProvider>
  );
}
