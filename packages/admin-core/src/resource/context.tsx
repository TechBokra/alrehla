'use client';

import * as React from 'react';
import type { ResourceContextValue } from './contracts';

export const ResourceContext = React.createContext<ResourceContextValue<unknown, unknown, unknown> | null>(null);

export function useResource<TData = unknown, TCreateValues = never, TUpdateValues = never>() {
  const context = React.useContext(ResourceContext);
  if (!context) throw new Error('Resource components must be rendered inside ResourceProvider.');
  return context as unknown as ResourceContextValue<TData, TCreateValues, TUpdateValues>;
}

export function useOptionalResource<TData = unknown, TCreateValues = never, TUpdateValues = never>() {
  return React.useContext(ResourceContext) as unknown as ResourceContextValue<TData, TCreateValues, TUpdateValues> | null;
}
