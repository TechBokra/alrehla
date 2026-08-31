'use client';

import * as React from 'react';
import { ResourceProvider } from '@alrehla/admin-core/resource';
import type { ResourceDefinition, ResourceListResult } from '@alrehla/admin-core/resource';
import { cn } from '../../lib/utils';

export interface ResourcePageProps<TData = unknown, TCreateValues = never, TUpdateValues = never, TQueryRaw = ResourceListResult<TData>> {
  resource: ResourceDefinition<TData, TCreateValues, TUpdateValues, TQueryRaw>;
  children: React.ReactNode;
  className?: string;
  notifier?: { success: (message: string) => void; error: (message: string) => void };
}

export function ResourcePage<TData, TCreateValues = never, TUpdateValues = never, TQueryRaw = ResourceListResult<TData>>({ resource, children, className, notifier }: ResourcePageProps<TData, TCreateValues, TUpdateValues, TQueryRaw>) {
  return <ResourceProvider definition={resource} notifier={notifier}><div className={cn('mx-auto w-full max-w-7xl space-y-6', className)}>{children}</div></ResourceProvider>;
}
