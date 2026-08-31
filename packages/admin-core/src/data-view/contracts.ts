import type * as React from 'react';
import type {
  ColumnOrderState,
  ExpandedState,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';

export interface DataViewFilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

/** Reference-compatible generic names for filter consumers. */
export type FilterOption = DataViewFilterOption;

export interface FacetedFilterConfig {
  id: string;
  title: string;
  options: readonly FilterOption[];
}

export type DataViewFilterType =
  | 'text'
  | 'single-select'
  | 'multi-select'
  | 'boolean'
  | 'date'
  | 'date-range'
  | 'number'
  | 'number-range'
  | 'entity'
  | 'enum'
  | 'status'
  | 'relation';

export interface DataViewRangeValue {
  from?: string | number;
  to?: string | number;
}

export type DataViewFilterValue =
  | string
  | string[]
  | number
  | boolean
  | DataViewRangeValue
  | null;

export interface DataViewFilterDefinition {
  id: string;
  label: string;
  type: DataViewFilterType;
  options?: readonly DataViewFilterOption[];
  placeholder?: string;
  parameter?: string;
  render?: (context: {
    value: DataViewFilterValue | undefined;
    onChange(value: DataViewFilterValue | undefined): void;
  }) => React.ReactNode;
}

export interface DataViewState {
  search: string;
  filters: Record<string, DataViewFilterValue>;
  sorting: SortingState;
  pagination: PaginationState;
  columnVisibility: VisibilityState;
  columnOrder: ColumnOrderState;
  rowSelection: RowSelectionState;
  expanded: ExpandedState;
}

export interface ResourceSelection {
  mode: ResourceSelectionMode;
  selectedIds: string[];
  executeIds: string[];
}

export type ResourceSelectionMode = 'explicit';

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

export type DataViewExportMode = 'current-page' | 'selected' | 'filtered' | 'all';

export interface DataViewExportColumn<TData> {
  key: string;
  label: string;
  value(row: TData): unknown;
}

export interface DataViewExportContext<TData> {
  mode: DataViewExportMode;
  state: DataViewState;
  currentRows: TData[];
  selectedIds: string[];
  executeIds: string[];
  selectedRows: TData[];
}

export interface DataViewExportConfig<TData> {
  filename: string | ((context: DataViewExportContext<TData>) => string);
  columns: readonly DataViewExportColumn<TData>[];
  modes: readonly DataViewExportMode[];
  fetchRows?: (context: DataViewExportContext<TData>) => Promise<TData[]>;
}

export type DataViewCsvRow = Record<string, string>;

export interface DataViewImportIssue {
  row: number;
  message: string;
  column?: string;
  severity: 'error' | 'warning';
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
    context: { row: number; rows: DataViewCsvRow[] },
  ) =>
    | Omit<DataViewImportIssue, 'row'>[]
    | Promise<Omit<DataViewImportIssue, 'row'>[]>;
  map?: (row: DataViewCsvRow, context: { row: number }) => TMapped | Promise<TMapped>;
  execute(context: DataViewImportExecutionContext<TMapped>): Promise<DataViewImportResult | void>;
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

export interface DataViewHierarchyConfig<TData> {
  enabled: true;
  getRowId(row: TData): string;
  getParentId(row: TData): string | null | undefined;
  getOrder(row: TData): number | null | undefined;
  getSubRows?: (row: TData) => readonly TData[] | undefined;
  updateRow?: (row: TData, update: DataViewHierarchyUpdate) => TData;
  allowReparent?: boolean;
  canDrag?: (row: TData) => boolean;
  canDrop?: (source: TData, target: TData) => boolean;
  canReparent?: (source: TData, parent: TData | null) => boolean;
  initialExpanded?: 'all' | 'none' | readonly string[];
  expandColumn?: boolean;
  indentSize?: number;
}

export interface DataViewHierarchyMoveResult<TData> {
  rows: TData[];
  moved: DataViewHierarchyUpdate;
  updates: DataViewHierarchyUpdate[];
}

export type DataTableBulkActionExecute<TData> = (
  rows: TData[],
) => void | Promise<void>;

export type DataTableBulkActionExecuteIds<TData> = (
  ids: string[],
  loadedRows: TData[],
) => unknown | Promise<unknown>;

export interface DataTableBulkActionDialogContext<TData> {
  open: boolean;
  rows: TData[];
  pending: boolean;
  onOpenChange(open: boolean): void;
  execute(override?: (rows: TData[]) => void | Promise<void>): Promise<void>;
}

export interface DataTableBulkAction<TData> {
  id: string;
  label: React.ReactNode;
  icon?: React.ElementType<{ className?: string }>;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  permission?: string;
  disabled?: (rows: TData[]) => boolean;
  execute?: (rows: TData[]) => void | Promise<void>;
  executeIds?: (ids: string[], loadedRows: TData[]) => unknown | Promise<unknown>;
  confirmation?: {
    title?: React.ReactNode;
    description?: React.ReactNode;
    resourceName?: string;
  };
  renderDialog?: (context: DataTableBulkActionDialogContext<TData>) => React.ReactNode;
}

export interface DataTableSelectionConfig<TData> {
  enabled?: boolean;
  getRowId: (row: TData) => string;
  enableRowSelection?: (row: TData) => boolean;
  mode?: 'single' | 'multiple';
  preserveAcrossPages?: boolean;
}

/** Backward-compatible name used by existing Alrehla Resource UI. */
export type DataViewBulkAction<TData> = DataTableBulkAction<TData>;

export type DropPosition = 'before' | 'after' | 'inside';

export interface DataTableReorderMoveContext<TData> {
  activeId: string;
  overId: string;
  active: TData;
  over: TData;
  position?: DropPosition;
  isNest?: boolean;
  targetParentId?: string | null;
}

export interface DataTableReorderConfig<TData> {
  enabled?: boolean;
  canDrag?: (row: TData) => boolean;
  canDrop?: (source: TData, target: TData, position?: DropPosition) => boolean;
  canNest?: (source: TData, target: TData) => boolean;
  allowNest?: boolean;
  onMove?: (context: DataTableReorderMoveContext<TData>) => void | Promise<void>;
  onNest?: (context: {
    activeId: string;
    targetParentId: string | null;
    active: TData;
    targetParent: TData | null;
  }) => void | Promise<void>;
  onReorder?: (
    rows: TData[],
    context: { activeId: string; overId: string; position?: DropPosition },
  ) => void | Promise<void>;
}
