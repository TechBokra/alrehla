import type * as React from "react";
import type { ColumnDef, Table as TanStackTable } from "@tanstack/react-table";
import type {
  DataTableBulkAction,
  DataTableReorderConfig,
  DataViewCsvRow,
  DataViewExportConfig,
  DataViewFilterValue,
  DataViewFilterDefinition,
  DataViewHierarchyConfig,
  DataViewHierarchyUpdate,
  DataViewImportConfig,
  DataViewImportExecutionContext,
  DataViewImportResult,
  DataViewSearchConfig,
  DataViewState,
  ResourceViewDefinition,
  ResourceSelection,
} from "../../data-view/contracts";
import type { ResourceActions } from "./resource-actions";
import type {
  ResourceMutationAdapters,
  ResourceDensity,
  ResourceFormState,
  ResourcePendingState,
} from "./resource-state";
import type {
  ResourceListResult,
  ResourceQueryDefinition,
} from "./resource-query";
import type { ResourceMutationsDefinition } from "./resource-mutation";
import type { ResourcePaginationDefinition } from "./resource-pagination";
import type { ResourceScope } from "../scope";
import type { ResourceErrorState } from "../errors";
import type { ResourceFormMode, ResourceFormPresentation } from "./resource-form";

/**
 * The resource runtime only needs to know how a form changes navigation state.
 * Admin Forms owns the complete form definition and its field runtime.
 */
export interface ResourceFormRuntimeMetadata<TData = unknown, TValues = unknown> {
  mode?: ResourceFormPresentation;
  presentation?: ResourceFormPresentation;
  href?: (context: { mode: ResourceFormMode; record?: unknown }) => string;
  title?:
    | string
    | ((context: { mode: ResourceFormMode; record?: TData }) => string);
  description?:
    | string
    | ((context: { mode: ResourceFormMode; record?: TData }) => string);
  defaultValues?: TValues;
  getDefaultValues?: (context: {
    mode: ResourceFormMode;
    record?: TData;
  }) => TValues;
  schema?: unknown;
  [key: string]: unknown;
}

export interface ResourceFormRuntimeMetadataMap<
  TData = unknown,
  TCreateInput = unknown,
  TUpdateInput = unknown,
> {
  create?: ResourceFormRuntimeMetadata<TData, TCreateInput>;
  update?: ResourceFormRuntimeMetadata<TData, TUpdateInput>;
}

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

/** Feature-owned Store permission mapping consumed by the generic resolver. */
export interface ResourceAuthorizationDefinition {
  read?: string;
  create?: string;
  update?: string;
  delete?: string;
  import?: string;
  export?: string;
  bulkActions?: string | string[];
}

export interface ResourceEmptyStateDefinition {
  title?: string;
  description?: string;
  icon?: ResourceIcon;
  createLabel?: string;
}

export interface ResourceImportDefinition<TMapped = DataViewCsvRow> {
  enabled?: boolean;
  config: Omit<DataViewImportConfig<TMapped>, "execute">;
  result?: (
    result: unknown,
    context: DataViewImportExecutionContext<TMapped>
  ) => DataViewImportResult | void;
}

export interface ResourceReorderDefinition<
  TData,
  TInput = DataViewHierarchyUpdate,
> {
  enabled?: boolean;
  getParentId?: (row: TData) => string | number | null | undefined;
  getPayload: (context: {
    updatedItem: {
      id: string | number;
      parentId: string | number | null;
      index: number;
    };
    rows: TData[];
  }) => TInput;
}

export interface ResourceRowAction<TData> {
  id: string;
  label: string;
  icon?: ResourceIcon;
  destructive?: boolean;
  /** Optional feature-owned permission for this custom action. */
  permission?: string;
  onSelect: (record: TData) => void | Promise<void>;
}

export interface ResourceDataViewSelection<TData> {
  enabled?: boolean;
  mode?: "single" | "multiple";
  preserveAcrossPages?: boolean;
  enableRowSelection?: (row: TData) => boolean;
}

export interface ResourceDataViewDefinition<
  TData,
  TValue = unknown,
  TImport = DataViewCsvRow,
> {
  columns: ColumnDef<TData, TValue>[];
  getRowId: (row: TData) => string;
  checkbox?: boolean;
  search?: DataViewSearchConfig;
  filters?: readonly DataViewFilterDefinition[];
  selection?: ResourceDataViewSelection<TData>;
  exportConfig?: DataViewExportConfig<TData>;
  hierarchy?: DataViewHierarchyConfig<TData>;
  enableColumnOrdering?: boolean;
  pageSizeOptions?: number[];
  processingMode?: "server" | "client";
  transformRows?: (rows: readonly TData[]) => readonly TData[];
  /** Optional destination used by the generic Resource table row navigation. */
  getRowHref?: (row: TData) => string | undefined;
  rowActions?: readonly ResourceRowAction<TData>[];
  bulkActions?: DataTableBulkAction<TData>[];
  reorder?: ResourceReorderDefinition<TData>;
  urlState?: {
    defaults?: {
      page?: number;
      pageSize?: number;
      sorting?: import("@tanstack/react-table").SortingState;
      filters?: DataViewState["filters"];
      columnVisibility?: import("@tanstack/react-table").VisibilityState;
      columnOrder?: import("@tanstack/react-table").ColumnOrderState;
      viewState?: DataViewState["viewState"];
    };
    allowedSortIds?: readonly string[];
    persistenceKey?: string;
  };
}

/** Runtime state passed to visual adapters; it has no dependency on UI components. */
export interface ResourceDataViewAdapter<
  TData,
  TValue = unknown,
  TImport = DataViewCsvRow,
> {
  data: readonly TData[];
  state: DataViewState;
  /** Authoritative effective authorized view for rendering; state.activeView is not an access grant. */
  view: ResourceViewDefinition | null;
  setActiveView: (viewId: string, history?: "push" | "replace") => void;
  setViewState: (
    viewId: string,
    state: Record<string, import("../../data-view/contracts").JsonValue>
  ) => void;
  patchViewState: (
    viewId: string,
    patch: Record<string, import("../../data-view/contracts").JsonValue | undefined>
  ) => void;
  /** Canonical semantic selection derived from `state.viewState.table.rowSelection`. */
  selectionState: ResourceSelection;
  clearSelection: () => void;
  setSelectedIds: (ids: string[]) => void;
  toggleSelection: (id: string, selected?: boolean) => void;
  removeSelectedIds: (ids: string[]) => void;
  getRowId?: (row: TData) => string;
  rowCount?: number;
  pageCount?: number;
  loading?: boolean;
  isRefetching?: boolean;
  error?: Error | null;
  partialError?: Error | null;
  /** Semantic Resource error state supplied by the framework-neutral runtime. */
  errorState?: ResourceErrorState | null;
  partialErrorState?: ResourceErrorState | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  emptyState?: React.ReactNode;
  processingMode?: "server" | "client";
  pageSizeOptions?: number[];
  search?: DataViewSearchConfig;
  searchInput?: string;
  onSearchInputChange?: (value: string) => void;
  onSearchChange?: (value: string) => void;
  filters?: readonly DataViewFilterDefinition[];
  onFilterChange?: (id: string, value: DataViewFilterValue | undefined) => void;
  onFiltersReset?: () => void;
  onPaginationChange?: (
    pagination: import("@tanstack/react-table").PaginationState
  ) => void;
  onSortingChange?: (
    sorting: import("@tanstack/react-table").SortingState
  ) => void;
  onColumnVisibilityChange?: (
    visibility: import("@tanstack/react-table").VisibilityState
  ) => void;
  onColumnOrderChange?: (
    order: import("@tanstack/react-table").ColumnOrderState
  ) => void;
  onRowSelectionChange?: (
    selection: import("@tanstack/react-table").RowSelectionState
  ) => void;
  onExpandedChange?: (
    expanded: import("@tanstack/react-table").ExpandedState
  ) => void;
  checkbox?: boolean;
  selection?: ResourceDataViewSelection<TData>;
  hierarchy?: DataViewHierarchyConfig<TData>;
  enableColumnOrdering?: boolean;
  bulkActions?: DataTableBulkAction<TData>[];
  importConfig?: DataViewImportConfig<TImport>;
  exportConfig?: DataViewExportConfig<TData>;
  reorder?: DataTableReorderConfig<TData>;
  renderToolbarActions?: () => React.ReactNode;
  hideToolbar?: boolean;
  hidePagination?: boolean;
  onTableReady?: (table: TanStackTable<TData> | null) => void;
  density?: ResourceDensity;
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
  /** The tenant boundary for every query, mutation, and cache operation. */
  scope?: ResourceScope;
  metadata: ResourceMetadata;
  capabilities?: ResourceCapabilities;
  /** Optional feature-owned Store permission mapping. */
  authorization?: ResourceAuthorizationDefinition;
  query?: ResourceQueryDefinition<TData, TQueryRaw>;
  mutations?: ResourceMutationsDefinition<
    TData,
    TCreateInput,
    TUpdateInput,
    TDeleteInput
  >;
  rowActions?: {
    edit?: boolean;
    delete?: boolean;
    actions?: readonly ResourceRowAction<TData>[];
  };
  bulkActions?: {
    delete?: boolean;
    actions?: readonly DataTableBulkAction<TData>[];
  };
  /** Individual bulk deletion is opt-in; domain bulk mutations are preferred. */
  bulkDelete?: {
    strategy: "individual";
  };
  dataView: ResourceDataViewDefinition<TData, TValue, TImport>;
  /** Optional serializable view declarations. Omitted resources use Table. */
  views?: readonly ResourceViewDefinition[];
  /** Admin Forms owns field interpretation; Core only reads navigation metadata. */
  forms?: ResourceFormRuntimeMetadataMap<TData, TCreateInput, TUpdateInput>;
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
  capabilities: Required<ResourceCapabilities>;
  dataView: ResourceDataViewAdapter<TData, TValue, TImport>;
  mutations?: ResourceMutationAdapters<TData, TDeleteInput>;
  actions: ResourceActions<TData, TCreateInput, TUpdateInput>;
  pending: ResourcePendingState;
  errors: import("./resource-state").ResourceOperationErrors;
  formState: ResourceFormState<TData>;
  deleteRecord: TData | null;
  dataTable: TanStackTable<TData> | null;
  density: ResourceDensity;
  setDensity: (density: ResourceDensity) => void;
  previewRecord: TData | null;
  openPreview: (record: TData) => void;
  closePreview: () => void;
  openCreate: () => void;
  openUpdate: (record: TData) => void;
  closeForm: () => void;
  openDelete: (record: TData) => void;
  closeDelete: () => void;
  setDataTable: (table: TanStackTable<TData> | null) => void;
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
  >
) {
  return definition;
}
