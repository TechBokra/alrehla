import type * as React from 'react';
import type { Table as TanStackTable, ColumnOrderState, PaginationState, RowSelectionState, SortingState, VisibilityState } from '@tanstack/react-table';
import type { ResourceDefinition } from './resource-definition';
import type { ResourceListResult } from './resource-query';
import type { DataViewBulkAction, DataViewFilterValue, DataViewState } from '../../data-view/contracts';

export type ResourceDensity = 'compact' | 'comfortable' | 'spacious';
export type ResourceFormState<TData> = { mode: 'closed' } | { mode: 'create' } | { mode: 'update'; record: TData };

export interface ResourcePendingState { create: boolean; update: boolean; delete: boolean; deleteMany: boolean }
export interface ResourceCapabilities { create?: boolean; update?: boolean; delete?: boolean; selection?: boolean; bulkActions?: boolean; export?: boolean }
export interface ResourceMetadata { name: string; label: string; singularLabel: string; pluralLabel?: string; description?: string; icon?: React.ElementType<{ className?: string }> }

export interface ResourceDataViewAdapter<TData> {
  data: readonly TData[];
  state: DataViewState;
  rowCount: number;
  pageCount: number;
  loading: boolean;
  isRefetching: boolean;
  error: Error | null;
  onRetry: () => void;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onFilterChange: (id: string, value: DataViewFilterValue | undefined) => void;
  onFiltersReset: () => void;
  onPaginationChange: (pagination: PaginationState) => void;
  onSortingChange: (sorting: SortingState) => void;
  onColumnVisibilityChange: (visibility: VisibilityState) => void;
  onColumnOrderChange: (order: ColumnOrderState) => void;
  onRowSelectionChange: (selection: RowSelectionState) => void;
  selectedRows: readonly TData[];
  bulkActions: DataViewBulkAction<TData>[];
}

export interface ResourceActions<TData, TCreateValues, TUpdateValues> {
  create: (values: TCreateValues) => Promise<unknown>;
  update: (record: TData, values: TUpdateValues) => Promise<unknown>;
  delete: (record: TData) => Promise<unknown>;
  deleteMany: (records: TData[]) => Promise<unknown>;
}

export interface ResourceContextValue<TData, TCreateValues, TUpdateValues> {
  definition: ResourceDefinition<TData, TCreateValues, TUpdateValues, ResourceListResult<TData>>;
  capabilities: Required<ResourceCapabilities>;
  dataView: ResourceDataViewAdapter<TData>;
  pending: ResourcePendingState;
  actions: ResourceActions<TData, TCreateValues, TUpdateValues>;
  formState: ResourceFormState<TData>;
  deleteRecord: TData | null;
  dataTable: TanStackTable<TData> | null;
  density: ResourceDensity;
  setDensity: (density: ResourceDensity) => void;
  openCreate: () => void;
  openUpdate: (record: TData) => void;
  closeForm: () => void;
  openDelete: (record: TData) => void;
  closeDelete: () => void;
  setDataTable: (table: TanStackTable<TData> | null) => void;
  previewRecord: TData | null;
  openPreview: (record: TData) => void;
  closePreview: () => void;
}

export interface ResourceProviderProps<TData, TCreateValues, TUpdateValues, TQueryRaw> {
  children: React.ReactNode;
  definition: ResourceDefinition<TData, TCreateValues, TUpdateValues, TQueryRaw>;
  notifier?: import('@alrehla/mutations').MutationNotifier;
  executionContext?: import('../execution-context').ResourceExecutionContext;
}
