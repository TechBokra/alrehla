import type * as React from "react";
import type {
  ColumnDef,
  ColumnFiltersState,
  ColumnOrderState,
  ExpandedState,
  PaginationState,
  RowSelectionState,
  SortingState,
  Table as TanStackTable,
  VisibilityState,
} from "@tanstack/react-table";
import type {
  DataTableBulkAction,
  DataTableReorderConfig,
  DataTableSelectionConfig,
  DataViewExportConfig,
  FacetedFilterConfig,
} from "@eng-mohamedelsayed/admin-core/data-view";
import type { ResourceErrorState } from "@eng-mohamedelsayed/admin-core/resource";

export type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount?: number;
  rowCount?: number;
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  emptyState?: React.ReactNode;
  processingMode?: "server" | "client";
  pageSizeOptions?: number[];
  isRefetching?: boolean;
  partialError?: Error | null;
  errorState?: ResourceErrorState | null;
  partialErrorState?: ResourceErrorState | null;
  pagination?: PaginationState;
  onPaginationChange?: (pagination: PaginationState) => void;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
  columnOrder?: ColumnOrderState;
  onColumnOrderChange?: (order: ColumnOrderState) => void;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  expanded?: ExpandedState;
  onExpandedChange?: (expanded: ExpandedState) => void;
  getRowId?: (row: TData) => string;
  checkbox?: boolean;
  selection?: DataTableSelectionConfig<TData>;
  reorder?: DataTableReorderConfig<TData>;
  hierarchy?: {
    enabled: true;
    getSubRows: (row: TData) => TData[] | undefined;
    initialExpanded?: "all" | "none" | readonly string[];
  };
  enableColumnOrdering?: boolean;
  bulkActions?: DataTableBulkAction<TData>[];
  exportConfig?: DataViewExportConfig<TData> | undefined;
  renderBulkActions?: (table: TanStackTable<TData>) => React.ReactNode;
  renderToolbar?: (table: TanStackTable<TData>) => React.ReactNode;
  onTableReady?: (table: TanStackTable<TData> | null) => void;
  hidePagination?: boolean;
  hideToolbar?: boolean;
  searchKey?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  facetedFilters?: FacetedFilterConfig[];
  density?: "compact" | "comfortable" | "spacious" | undefined;
  onRowClick?: (row: TData) => void;
};
