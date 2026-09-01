import type * as React from 'react';
import type {
  ColumnDef,
  ColumnOrderState,
  ExpandedState,
  PaginationState,
  RowSelectionState,
  SortingState,
  Table as TanStackTable,
  VisibilityState,
} from '@tanstack/react-table';
import type {
  DataTableBulkAction,
  DataTableReorderConfig,
  DataViewCsvRow,
  DataViewExportConfig,
  DataViewFilterDefinition,
  DataViewFilterValue,
  DataViewHierarchyConfig,
  DataViewHierarchyUpdate,
  DataViewImportConfig,
  DataViewImportExecutionContext,
  DataViewImportResult,
  DataViewCalendarConfig,
  DataViewSearchConfig,
  DataViewState,
  DataViewViewsConfig,
  ResourceSelection,
} from '../../data-view/contracts';
import type { ResourceAuthorization } from '../authorization';
import type { ResourceErrorState } from '../errors';
import type { ResourceExecutionContext } from '../execution-context';
import type { ResourceScope } from '../scope';
import type { ResourceActions } from './resource-actions';
import type { ResourceFormsDefinition } from './resource-form';
import type { ResourceMutationsDefinition } from './resource-mutation';
import type { ResourcePaginationDefinition } from './resource-pagination';
import type { ResourceListResult, ResourceQueryDefinition } from './resource-query';
import type {
  ResourceDensity,
  ResourceFormState,
  ResourceMutationAdapters,
  ResourceOperationErrors,
  ResourcePendingState,
} from './resource-state';

export type ResourceIcon = React.ElementType<{ className?: string }>;

export interface ResourceMetadata {
  name: string;
  label: string;
  singularLabel: string;
  pluralLabel?: string;
  description?: string;
  icon?: ResourceIcon;
}

export interface ResourceCapabilities {
  create?: boolean;
  update?: boolean;
  delete?: boolean;
  import?: boolean;
  export?: boolean;
  bulkActions?: boolean;
  selection?: boolean;
}

export interface ResourceAuthorizationDefinition {
  read?: string;
  create?: string;
  update?: string;
  delete?: string;
  import?: string;
  export?: string;
  bulkActions?: string | readonly string[];
}

export interface ResourceEmptyStateDefinition {
  title?: string;
  description?: string;
  icon?: ResourceIcon;
  createLabel?: string;
}

export interface ResourceImportDefinition<TMapped = DataViewCsvRow> {
  enabled?: boolean;
  config: Omit<DataViewImportConfig<TMapped>, 'execute'>;
  result?: (
    result: unknown,
    context: DataViewImportExecutionContext<TMapped>,
  ) => DataViewImportResult | void;
}

export interface ResourceReorderDefinition<TData> {
  enabled?: boolean;
  getParentId?: (row: TData) => string | number | null | undefined;
  getPayload(context: {
    updatedItem: {
      id: string | number;
      parentId: string | number | null;
      index: number;
    };
    rows: TData[];
  }): DataViewHierarchyUpdate;
}

export interface ResourceRowAction<TData> {
  id: string;
  label: string;
  icon?: ResourceIcon;
  destructive?: boolean;
  permission?: string;
  onSelect(record: TData): void | Promise<void>;
}

export interface ResourceDataViewSelection<TData> {
  enabled?: boolean;
  mode?: 'single' | 'multiple';
  preserveAcrossPages?: boolean;
  enableRowSelection?: (row: TData) => boolean;
}

export interface ResourceDataViewDefinition<
  TData,
  TValue = unknown,
  TImport = DataViewCsvRow,
> {
  columns: ColumnDef<TData, TValue>[];
  getRowId(row: TData): string;
  views?: DataViewViewsConfig;
  calendar?: DataViewCalendarConfig<TData>;
  checkbox?: boolean;
  search?: DataViewSearchConfig;
  filters?: readonly DataViewFilterDefinition[];
  selection?: ResourceDataViewSelection<TData>;
  exportConfig?: DataViewExportConfig<TData>;
  hierarchy?: DataViewHierarchyConfig<TData>;
  enableColumnOrdering?: boolean;
  pageSizeOptions?: readonly number[];
  processingMode?: 'server' | 'client';
  transformRows?: (rows: readonly TData[]) => readonly TData[];
  getRowHref?: (row: TData) => string | undefined;
  rowActions?: readonly ResourceRowAction<TData>[];
  bulkActions?: readonly DataTableBulkAction<TData>[];
  reorder?: ResourceReorderDefinition<TData>;
  urlState?: {
    defaults?: {
      page?: number;
      pageSize?: number;
      sorting?: SortingState;
      filters?: DataViewState['filters'];
      columnVisibility?: VisibilityState;
      columnOrder?: ColumnOrderState;
    };
    allowedSortIds?: readonly string[];
    persistenceKey?: string;
  };
}

export interface ResourceControlCapabilities {
  pagination: boolean;
  selection: boolean;
  density: boolean;
  columns: boolean;
  sorting: boolean;
}

export interface ResourceDataViewAdapter<
  TData,
  TValue = unknown,
  TImport = DataViewCsvRow,
> {
  data: readonly TData[];
  state: DataViewState;
  controlCapabilities: ResourceControlCapabilities;
  selectionState: ResourceSelection;
  clearSelection(): void;
  setSelectedIds(ids: string[]): void;
  toggleSelection(id: string, selected?: boolean): void;
  removeSelectedIds(ids: string[]): void;
  getRowId(row: TData): string;
  rowCount: number;
  pageCount: number;
  loading: boolean;
  isRefetching: boolean;
  error: Error | null;
  partialError: Error | null;
  errorState: ResourceErrorState | null;
  partialErrorState: ResourceErrorState | null;
  onRetry(): void;
  processingMode: 'server' | 'client';
  pageSizeOptions: readonly number[];
  search?: DataViewSearchConfig;
  searchInput: string;
  onSearchInputChange(value: string): void;
  onSearchChange(value: string): void;
  filters: readonly DataViewFilterDefinition[];
  onFilterChange(id: string, value: DataViewFilterValue | undefined): void;
  onFiltersReset(): void;
  onPaginationChange(pagination: PaginationState): void;
  onSortingChange(sorting: SortingState): void;
  onColumnVisibilityChange(visibility: VisibilityState): void;
  onColumnOrderChange(order: ColumnOrderState): void;
  onRowSelectionChange(selection: RowSelectionState): void;
  onExpandedChange(expanded: ExpandedState): void;
  onViewChange(view: DataViewState['view']): void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  emptyState?: React.ReactNode;
  checkbox?: boolean;
  selection?: ResourceDataViewSelection<TData>;
  hierarchy?: DataViewHierarchyConfig<TData>;
  enableColumnOrdering?: boolean;
  selectedRows: readonly TData[];
  bulkActions: readonly DataTableBulkAction<TData>[];
  importConfig?: DataViewImportConfig<TImport>;
  exportConfig?: DataViewExportConfig<TData>;
  reorder?: DataTableReorderConfig<TData>;
  onTableReady(table: TanStackTable<TData> | null): void;
  density: ResourceDensity;
  renderToolbarActions?: () => React.ReactNode;
  hideToolbar?: boolean;
  hidePagination?: boolean;
  onRowClick?: (row: TData) => void;
}

export interface ResourceDefinition<
  TData,
  TCreateInput = unknown,
  TUpdateInput = unknown,
  TQueryRaw = ResourceListResult<TData>,
  TValue = unknown,
  TImport = DataViewCsvRow,
  TDeleteInput = string,
> {
  scope?: ResourceScope;
  metadata: ResourceMetadata;
  capabilities?: ResourceCapabilities;
  authorization?: ResourceAuthorizationDefinition;
  query?: ResourceQueryDefinition<TData, TQueryRaw>;
  mutations?: ResourceMutationsDefinition<TData, TCreateInput, TUpdateInput, TDeleteInput>;
  rowActions?: {
    edit?: boolean;
    delete?: boolean;
    actions?: readonly ResourceRowAction<TData>[];
  };
  bulkActions?: {
    delete?: boolean;
    actions?: readonly DataTableBulkAction<TData>[];
  };
  bulkDelete?: { strategy: 'individual' };
  dataView: ResourceDataViewDefinition<TData, TValue, TImport>;
  forms?: ResourceFormsDefinition<TData, TCreateInput, TUpdateInput>;
  pagination?: ResourcePaginationDefinition;
  emptyState?: ResourceEmptyStateDefinition;
  import?: ResourceImportDefinition<TImport>;
  export?: DataViewExportConfig<TData>;
  readonly __resourceInputs?: { create: TCreateInput; update: TUpdateInput };
}

export interface ResourceContextValue<
  TData,
  TCreateInput = unknown,
  TUpdateInput = unknown,
  TQueryRaw = ResourceListResult<TData>,
  TValue = unknown,
  TImport = DataViewCsvRow,
  TDeleteInput = string,
> {
  definition: ResourceDefinition<
    TData,
    TCreateInput,
    TUpdateInput,
    TQueryRaw,
    TValue,
    TImport,
    TDeleteInput
  >;
  authorization?: ResourceAuthorization;
  capabilities: Required<ResourceCapabilities>;
  dataView: ResourceDataViewAdapter<TData, TValue, TImport>;
  mutations: ResourceMutationAdapters<TData, TDeleteInput>;
  actions: ResourceActions<TData, TCreateInput, TUpdateInput>;
  pending: ResourcePendingState;
  errors: ResourceOperationErrors;
  formState: ResourceFormState<TData>;
  deleteRecord: TData | null;
  dataTable: TanStackTable<TData> | null;
  density: ResourceDensity;
  setDensity(density: ResourceDensity): void;
  previewRecord: TData | null;
  openPreview(record: TData): void;
  closePreview(): void;
  openCreate(): void;
  openUpdate(record: TData): void;
  closeForm(): void;
  openDelete(record: TData): void;
  closeDelete(): void;
  setDataTable(table: TanStackTable<TData> | null): void;
}

export interface ResourceProviderProps<
  TData,
  TCreateInput = unknown,
  TUpdateInput = unknown,
  TQueryRaw = ResourceListResult<TData>,
  TValue = unknown,
  TImport = DataViewCsvRow,
  TDeleteInput = string,
> {
  children: React.ReactNode;
  definition: ResourceDefinition<
    TData,
    TCreateInput,
    TUpdateInput,
    TQueryRaw,
    TValue,
    TImport,
    TDeleteInput
  >;
  initialData?: TQueryRaw;
  defaultDensity?: ResourceDensity;
  notifier?: import('@alrehla/mutations').MutationNotifier;
  executionContext?: ResourceExecutionContext;
}

export function defineResource<
  TData,
  TCreateInput = unknown,
  TUpdateInput = unknown,
  TQueryRaw = ResourceListResult<TData>,
  TValue = unknown,
  TImport = DataViewCsvRow,
  TDeleteInput = string,
>(
  definition: ResourceDefinition<
    TData,
    TCreateInput,
    TUpdateInput,
    TQueryRaw,
    TValue,
    TImport,
    TDeleteInput
  >,
) {
  return definition;
}
