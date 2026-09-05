import type * as React from "react";
import type {
  ColumnOrderState,
  ExpandedState,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";

/** JSON values are the only values allowed in serialized resource metadata. */
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

export type FilterOption = {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
};

export type FacetedFilterConfig = {
  id: string;
  title: string;
  options: FilterOption[];
};

export type DataViewFilterType =
  | "text"
  | "single-select"
  | "multi-select"
  | "boolean"
  | "date"
  | "date-range"
  | "number"
  | "number-range"
  | "entity"
  | "enum"
  | "status"
  | "relation";

export interface DataViewRangeValue {
  from?: string | number;
  to?: string | number;
}

export type DataViewFilterValue =
  string | string[] | number | boolean | DataViewRangeValue | null;

export interface DataViewFilterDefinition {
  id: string;
  label: string;
  type: DataViewFilterType;
  options?: FilterOption[];
  placeholder?: string;
  parameter?: string;
  render?: (context: {
    value: DataViewFilterValue | undefined;
    onChange: (value: DataViewFilterValue | undefined) => void;
  }) => React.ReactNode;
}

export interface DataViewCapabilities {
  search?: boolean;
  filtering?: boolean;
  sorting?: boolean;
  pagination?: boolean;
  selection?: boolean;
  bulkActions?: boolean;
  reordering?: boolean;
  hierarchy?: boolean;
  columnVisibility?: boolean;
  dateRange?: boolean;
  grouping?: boolean;
}

/** A data-only view declaration stored on a Resource definition. */
export interface ResourceViewDefinition {
  id: string;
  type: string;
  label?: string;
  icon?: string;
  default?: boolean;
  permission?: string;
  capabilities?: DataViewCapabilities;
  config?: Record<string, JsonValue>;
}

export type DataViewViewState = Record<string, JsonValue>;

/** Typed state owned by the built-in table renderer. */
export interface DataViewTableState {
  pagination: PaginationState;
  columnVisibility: VisibilityState;
  columnOrder: ColumnOrderState;
  rowSelection: RowSelectionState;
  expanded: ExpandedState;
}

/** The canonical, serializable state shared by all DataView consumers. */
export interface DataViewState {
  search: string;
  filters: Record<string, DataViewFilterValue>;
  sorting: SortingState;
  /**
   * Requested/declarative view ID, normalized by the URL adapter when possible.
   * Not authorization evidence: Resource execution must use context.view or
   * dataView.view, which contain the effective authorized view (or null).
   */
  activeView: string;
  viewState: Record<string, DataViewViewState>;
}

/** Accepted only at compatibility boundaries; never emitted by Core state. */
export interface LegacyDataViewTableState {
  pagination?: PaginationState;
  columnVisibility?: VisibilityState;
  columnOrder?: ColumnOrderState;
  rowSelection?: RowSelectionState;
  expanded?: ExpandedState;
}

export type DataViewStateInput = Partial<DataViewState> &
  LegacyDataViewTableState;

/**
 * The semantic selection contract shared by Resource and DataView consumers.
 *
 * `rowSelection` remains TanStack Table's presentation state. Resource code
 * must use this contract when deciding which records a command executes
 * against. The explicit mode intentionally has no server-wide "all matching"
 * interpretation.
 */
export type ResourceSelectionMode = "explicit";

export interface ResourceSelection {
  mode: ResourceSelectionMode;
  /** IDs currently known to the UI as selected. */
  selectedIds: string[];
  /** IDs a bulk command is authoritative to execute against. */
  executeIds: string[];
}

/** Outcome shape understood by selection consumers when an action is partial. */
export interface ResourceSelectionExecution {
  successIds: string[];
  failedIds: string[];
}

export interface DataViewSearchConfig {
  enabled?: boolean;
  placeholder?: string;
  debounceMs?: number;
  ariaLabel?: string;
}

export type DataViewExportMode =
  "current-page" | "selected" | "filtered" | "all";

export interface DataViewExportColumn<TData> {
  key: string;
  label: string;
  value: (row: TData) => unknown;
}

export interface DataViewExportContext<TData> {
  mode: DataViewExportMode;
  state: DataViewState;
  currentRows: TData[];
  selectedIds: string[];
  /** The authoritative IDs for a selected export. */
  executeIds: string[];
  selectedRows: TData[];
}

export interface DataViewExportConfig<TData> {
  filename: string | ((context: DataViewExportContext<TData>) => string);
  columns: DataViewExportColumn<TData>[];
  modes: readonly DataViewExportMode[];
  fetchRows?: (context: DataViewExportContext<TData>) => Promise<TData[]>;
}

export type DataViewCsvRow = Record<string, string>;

export interface DataViewImportIssue {
  row: number;
  message: string;
  column?: string;
  severity: "error" | "warning";
  code?: string;
}

export interface DataViewImportRow<TMapped> {
  row: number;
  raw: DataViewCsvRow;
  mapped?: TMapped;
  issues: DataViewImportIssue[];
  duplicate: boolean;
}

export interface DataViewImportExecutionContext<TMapped> {
  file: File;
  headers: string[];
  rows: DataViewImportRow<TMapped>[];
  validRows: Array<DataViewImportRow<TMapped> & { mapped: TMapped }>;
}

export interface DataViewImportResult {
  total: number;
  succeeded: number;
  failed: number;
  warnings: number;
  message?: string;
}

export interface DataViewImportConfig<TMapped = DataViewCsvRow> {
  accept?: string;
  maxFileSize?: number;
  expectedColumns?: readonly string[];
  requiredColumns?: readonly string[];
  previewRows?: number;
  allowPartial?: boolean;
  duplicateKey?: (row: DataViewCsvRow) => string | null | undefined;
  validate?: (
    row: DataViewCsvRow,
    context: { row: number; rows: DataViewCsvRow[] }
  ) =>
    | Omit<DataViewImportIssue, "row">[]
    | Promise<Omit<DataViewImportIssue, "row">[]>;
  map?: (
    row: DataViewCsvRow,
    context: { row: number }
  ) => TMapped | Promise<TMapped>;
  execute: (
    context: DataViewImportExecutionContext<TMapped>
  ) => Promise<DataViewImportResult | void>;
}

export interface DataViewHierarchyMetadata {
  id: string;
  parentId: string | null;
  depth: number;
  order: number;
  orphaned: boolean;
}

export interface DataViewHierarchyRow<TData> {
  row: TData;
  meta: DataViewHierarchyMetadata;
  children: DataViewHierarchyRow<TData>[];
}

export interface DataViewHierarchyUpdate {
  id: string;
  parentId: string | null;
  rank: number;
}

export interface DataViewHierarchyMoveResult<TData> {
  rows: TData[];
  moved: DataViewHierarchyUpdate;
  updates: DataViewHierarchyUpdate[];
}

export interface DataViewHierarchyConfig<TData> {
  enabled: true;
  getRowId: (row: TData) => string;
  getParentId: (row: TData) => string | null | undefined;
  getOrder: (row: TData) => number | null | undefined;
  getSubRows?: (row: TData) => readonly TData[] | undefined;
  updateRow?: (row: TData, update: DataViewHierarchyUpdate) => TData;
  allowReparent?: boolean;
  canDrag?: (row: TData) => boolean;
  canDrop?: (source: TData, target: TData) => boolean;
  canReparent?: (source: TData, parent: TData | null) => boolean;
  initialExpanded?: "all" | "none" | readonly string[];
  expandColumn?: boolean;
  indentSize?: number | undefined;
}

export type DataTableBulkActionExecute<TData> = (
  rows: TData[]
) => void | Promise<void>;

export type DataTableBulkActionExecuteIds<TData> = (
  ids: string[],
  loadedRows: TData[]
) => unknown | Promise<unknown>;

export interface DataTableBulkActionDialogContext<TData> {
  open: boolean;
  rows: TData[];
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  execute: (override?: DataTableBulkActionExecute<TData>) => Promise<void>;
}

export interface DataTableBulkAction<TData> {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  /** Optional feature-owned permission for this action. */
  permission?: string;
  disabled?: (rows: TData[]) => boolean;
  execute?: DataTableBulkActionExecute<TData>;
  executeIds?: DataTableBulkActionExecuteIds<TData>;
  confirmation?: {
    title?: string;
    description?: string;
    resourceName?: string;
  };
  renderDialog?: (
    context: DataTableBulkActionDialogContext<TData>
  ) => React.ReactNode;
}

export interface DataTableSelectionConfig<TData> {
  enabled?: boolean;
  getRowId: (row: TData) => string;
  enableRowSelection?: (row: TData) => boolean;
  mode?: "single" | "multiple";
  preserveAcrossPages?: boolean;
}

export type DropPosition = "before" | "after" | "inside";

export interface DataTableReorderMoveContext<TData> {
  activeId: string;
  overId: string;
  active: TData;
  over: TData;
  position?: DropPosition | undefined;
  isNest?: boolean | undefined;
  targetParentId?: string | null | undefined;
}

export interface DataTableReorderConfig<TData> {
  enabled?: boolean;
  canDrag?: (row: TData) => boolean;
  canDrop?: (source: TData, target: TData, position?: DropPosition) => boolean;
  canNest?: (source: TData, target: TData) => boolean;
  allowNest?: boolean;
  onMove?: (
    context: DataTableReorderMoveContext<TData>
  ) => void | Promise<void>;
  onNest?: (context: {
    activeId: string;
    targetParentId: string | null;
    active: TData;
    targetParent: TData | null;
  }) => void | Promise<void>;
  onReorder?: (
    rows: TData[],
    context: { activeId: string; overId: string; position?: DropPosition }
  ) => void | Promise<void>;
}
