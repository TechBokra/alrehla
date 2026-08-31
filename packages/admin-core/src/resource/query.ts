'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { DataViewState } from '../data-view/contracts';
import type { ResourceDefinition, ResourceListResult } from './contracts';

export function useResourceQuery<TData, TCreateValues, TUpdateValues, TQueryRaw>(definition: ResourceDefinition<TData, TCreateValues, TUpdateValues, TQueryRaw>, state: DataViewState) {
  const queryDefinition = definition.query;
  const context = React.useMemo(() => ({ state }), [state]);
  return useQuery<TQueryRaw, Error, ResourceListResult<TData>>({
    queryKey: queryDefinition?.queryKey(context) ?? ['resource', definition.metadata.name, 'disabled'],
    enabled: Boolean(queryDefinition) && (queryDefinition?.enabled?.(context) ?? true),
    queryFn: async () => {
      if (!queryDefinition) throw new Error(`The ${definition.metadata.name} resource has no query.`);
      return queryDefinition.queryFn(context);
    },
    select: (response) => queryDefinition?.normalize(response) ?? { rows: [], count: 0 },
    placeholderData: (previous) => previous,
    ...(queryDefinition?.staleTime !== undefined ? { staleTime: queryDefinition.staleTime } : {}),
  });
}
