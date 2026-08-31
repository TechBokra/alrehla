'use client';

import * as React from 'react';
import { SearchInput } from '../forms/search-input';
import { useResource } from '@alrehla/admin-core/resource';
import type { DataViewFilterValue } from '@alrehla/admin-core/data-view';
import { cn } from '../../lib/utils';

export function ResourceSearch({ className }: { className?: string }) {
  const { definition, dataView } = useResource();
  const filters = definition.dataView.filters ?? [];
  return <div className={cn('flex flex-1 flex-wrap items-center gap-2', className)}><SearchInput value={dataView.searchInput} onChange={(event) => dataView.onSearchInputChange(event.target.value)} placeholder={definition.dataView.search?.placeholder ?? `بحث في ${definition.metadata.pluralLabel ?? definition.metadata.label}...`} aria-label={definition.dataView.search?.ariaLabel} className="w-full md:w-96" />{filters.map((filter) => filter.options?.length ? <select key={filter.id} value={String(dataView.state.filters[filter.id] ?? '')} aria-label={filter.label} onChange={(event) => dataView.onFilterChange(filter.id, (event.target.value || undefined) as DataViewFilterValue)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">{filter.label}</option>{filter.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : null)}</div>;
}
