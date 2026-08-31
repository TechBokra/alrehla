import type * as React from 'react';
import type {
  ColumnOrderState,
  ExpandedState,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';

export type DataViewFilterType =
  | 'text'
  | 'single-select'
  | 'multi-select'
  | 'boolean'
  | 'date'
  | 'date-range'
  | 'number'
  | 'number-range'
  | 'enum';

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

export interface DataViewFilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface DataViewFilterDefinition {
  id: string;
  label: string;
  type: DataViewFilterType;
  parameter?: string;
  placeholder?: string;
  options?: readonly DataViewFilterOption[];
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

export interface DataViewSearchConfig {
  enabled?: boolean;
  placeholder?: string;
  debounceMs?: number;
  ariaLabel?: string;
}

export type DataViewExportMode = 'current-page' | 'selected' | 'filtered' | 'all';

export interface DataViewExportConfig<TData> {
  filename: string;
  columns: readonly { key: string; label: string; value: (row: TData) => unknown }[];
  modes?: readonly DataViewExportMode[];
}

export type DataViewBulkAction<TData> = {
  id: string;
  label: React.ReactNode;
  icon?: React.ElementType<{ className?: string }>;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  disabled?: (rows: TData[]) => boolean;
  execute: (rows: TData[]) => void | Promise<void>;
  confirmation?: { title?: React.ReactNode; description?: React.ReactNode };
};
