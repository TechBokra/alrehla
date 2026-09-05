"use client";

import * as React from "react";
import type {
  ColumnDef,
  ColumnOrderState,
  ExpandedState,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { Input } from "../../ui/input";
import { DataTable } from "./data-table";
import { DataViewExportMenu } from "../export-import/data-view-export-menu";
import { DataViewFilterControls } from "../filters/data-view-filters";
import { DataViewImportDialog } from "../export-import/data-view-import-dialog";
import type {
  DataTableBulkAction,
  DataTableReorderConfig,
  DataViewExportConfig,
  DataViewFilterDefinition,
  DataViewFilterValue,
  DataViewHierarchyConfig,
  DataViewImportConfig,
  DataViewSearchConfig,
  DataViewState,
  ResourceSelection,
} from "@eng-mohamedelsayed/admin-core/data-view";
import {
  createResourceSelection,
  getDataViewTableState,
} from "@eng-mohamedelsayed/admin-core/data-view";
import type { ResourceErrorState } from "@eng-mohamedelsayed/admin-core/resource";

export interface DataViewProps<
  TData,
  TValue,
  TImport = Record<string, string>,
> {
  columns: ColumnDef<TData, TValue>[];
  data: readonly TData[];
  state: DataViewState;
  /** Semantic selection supplied by Resource runtime; falls back to explicit row state. */
  selectionState?: ResourceSelection;
  getRowId: (row: TData) => string;
  rowCount?: number;
  pageCount?: number;
  loading?: boolean;
  isRefetching?: boolean;
  error?: Error | null;
  partialError?: Error | null;
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
  /** Optional transient value while the normalized state stays debounced. */
  searchInput?: string;
  onSearchInputChange?: (value: string) => void;
  onSearchChange?: (value: string) => void;
  filters?: readonly DataViewFilterDefinition[];
  onFilterChange?: (id: string, value: DataViewFilterValue | undefined) => void;
  onFiltersReset?: () => void;

  onPaginationChange?: (pagination: PaginationState) => void;
  onSortingChange?: (sorting: SortingState) => void;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
  onColumnOrderChange?: (order: ColumnOrderState) => void;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  onExpandedChange?: (expanded: ExpandedState) => void;

  checkbox?: boolean;
  selection?: {
    enabled?: boolean;
    mode?: "single" | "multiple";
    preserveAcrossPages?: boolean;
    enableRowSelection?: (row: TData) => boolean;
  };
  bulkActions?: DataTableBulkAction<TData>[];
  reorder?: DataTableReorderConfig<TData>;
  hierarchy?: DataViewHierarchyConfig<TData>;
  exportConfig?: DataViewExportConfig<TData>;
  importConfig?: DataViewImportConfig<TImport>;
  enableColumnOrdering?: boolean;
  renderToolbarActions?: () => React.ReactNode;
  /** Lets a page compose DataView controls explicitly. */
  hideToolbar?: boolean;
  /** Lets a page compose the existing pagination primitive explicitly. */
  hidePagination?: boolean;
  onTableReady?: (
    table: import("@tanstack/react-table").Table<TData> | null
  ) => void;
  // Density
  density?: ("compact" | "comfortable" | "spacious") | undefined;
  onRowClick?: (row: TData) => void;
}

export function DataView<TData, TValue, TImport = Record<string, string>>({
  columns,
  data,
  state,
  getRowId,
  rowCount,
  pageCount,
  loading,
  isRefetching,
  error,
  partialError,
  errorState,
  partialErrorState,
  onRetry,
  emptyTitle,
  emptyDescription,
  emptyAction,
  emptyState,
  processingMode = "server",
  pageSizeOptions,
  search,
  searchInput,
  onSearchInputChange,
  onSearchChange,
  filters = [],
  onFilterChange,
  onFiltersReset,
  onPaginationChange,
  onSortingChange,
  onColumnVisibilityChange,
  onColumnOrderChange,
  onRowSelectionChange,
  selectionState,
  onExpandedChange,
  checkbox,
  selection,
  bulkActions,
  reorder,
  hierarchy,
  exportConfig,
  importConfig,
  enableColumnOrdering,
  renderToolbarActions,
  density,
  hideToolbar = false,
  hidePagination = false,
  onTableReady,
  onRowClick,
}: DataViewProps<TData, TValue, TImport>) {
  const tableState = getDataViewTableState(state);
  const effectiveSelection =
    selectionState ?? createResourceSelection(tableState.rowSelection);
  const tableData = React.useMemo(() => [...data], [data]);
  const hierarchyGetSubRows = hierarchy?.getSubRows;
  const tableHierarchy = hierarchyGetSubRows
    ? {
        enabled: true as const,
        getSubRows: (row: TData) => {
          const subRows = hierarchyGetSubRows(row);
          return subRows ? [...subRows] : undefined;
        },
        ...(hierarchy.initialExpanded
          ? { initialExpanded: hierarchy.initialExpanded }
          : {}),
      }
    : undefined;
  const [internalSearch, setInternalSearch] = React.useState(state.search);
  const displayedSearch = searchInput ?? internalSearch;
  const searchEnabled =
    search?.enabled !== false && Boolean(onSearchChange || onSearchInputChange);

  const resetPage = React.useCallback(() => {
    if (tableState.pagination.pageIndex !== 0) {
      onPaginationChange?.({ ...tableState.pagination, pageIndex: 0 });
    }
  }, [onPaginationChange, tableState.pagination]);

  React.useEffect(() => {
    if (searchInput === undefined) setInternalSearch(state.search);
  }, [searchInput, state.search]);

  React.useEffect(() => {
    if (!searchEnabled || searchInput !== undefined || !onSearchChange) return;
    if (internalSearch.trim() === state.search) return;
    const timeout = window.setTimeout(
      () => {
        resetPage();
        onSearchChange(internalSearch.trim());
      },
      Math.max(0, search?.debounceMs ?? 300)
    );
    return () => window.clearTimeout(timeout);
  }, [
    internalSearch,
    onSearchChange,
    resetPage,
    search?.debounceMs,
    searchEnabled,
    searchInput,
    state.search,
  ]);

  const initializedHierarchy = React.useRef(false);
  React.useEffect(() => {
    if (initializedHierarchy.current || !hierarchy) return;
    initializedHierarchy.current = true;

    const initial = hierarchy.initialExpanded;
    const hasControlledExpansion =
      tableState.expanded === true || Object.keys(tableState.expanded).length > 0;
    if (
      !onExpandedChange ||
      hasControlledExpansion ||
      initial === "none" ||
      !initial
    ) {
      return;
    }

    onExpandedChange(
      initial === "all"
        ? true
        : Object.fromEntries(initial.map((id) => [id, true]))
    );
  }, [hierarchy, onExpandedChange, tableState.expanded]);

  const setSearchValue = (value: string) => {
    if (searchInput === undefined) setInternalSearch(value);
    onSearchInputChange?.(value);
    if (searchInput !== undefined && !onSearchInputChange) {
      resetPage();
      onSearchChange?.(value);
    }
  };

  const toolbar = () => (
    <div className="flex flex-wrap items-center justify-between gap-4 px-3 py-2">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {searchEnabled ? (
          <Input
            type="search"
            aria-label={search?.ariaLabel ?? "Search records"}
            placeholder={search?.placeholder ?? "Search…"}
            value={displayedSearch}
            onChange={(event) => setSearchValue(event.target.value)}
            className="h-8 w-[200px] lg:w-[300px]"
          />
        ) : null}
        {filters.length && onFilterChange ? (
          <DataViewFilterControls
            definitions={filters}
            values={state.filters}
            onChange={(id, value) => {
              resetPage();
              onFilterChange(id, value);
            }}
            onReset={() => {
              resetPage();
              onFiltersReset?.();
            }}
          />
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {renderToolbarActions?.()}
        {importConfig ? <DataViewImportDialog config={importConfig} /> : null}
        {exportConfig ? (
          <DataViewExportMenu
            config={exportConfig}
            data={data}
            state={state}
            selection={effectiveSelection}
            getRowId={getRowId}
            {...(hierarchy?.getSubRows
              ? { getSubRows: hierarchy.getSubRows }
              : {})}
          />
        ) : null}
      </div>
    </div>
  );

  return (
    <DataTable<TData, TValue>
      columns={columns}
      data={tableData}
      getRowId={getRowId}
      {...(rowCount !== undefined ? { rowCount } : {})}
      {...(pageCount !== undefined ? { pageCount } : {})}
      {...(loading !== undefined ? { loading } : {})}
      {...(isRefetching !== undefined ? { isRefetching } : {})}
      {...(error !== undefined ? { error } : {})}
      {...(partialError !== undefined ? { partialError } : {})}
      {...(errorState !== undefined ? { errorState } : {})}
      {...(partialErrorState !== undefined ? { partialErrorState } : {})}
      {...(onRetry ? { onRetry } : {})}
      {...(emptyTitle !== undefined ? { emptyTitle } : {})}
      {...(emptyDescription !== undefined ? { emptyDescription } : {})}
      {...(emptyAction !== undefined ? { emptyAction } : {})}
      {...(emptyState !== undefined ? { emptyState } : {})}
      processingMode={processingMode}
      {...(pageSizeOptions ? { pageSizeOptions } : {})}
      pagination={tableState.pagination}
      {...(onPaginationChange ? { onPaginationChange } : {})}
      sorting={state.sorting}
      onSortingChange={(next) => {
        // Sorting changes record order but not record identity. The Resource
        // selection contract therefore preserves explicit IDs; the URL-state
        // adapter resets the page as part of the sort update.
        onSortingChange?.(next);
      }}
      columnVisibility={tableState.columnVisibility}
      {...(onColumnVisibilityChange ? { onColumnVisibilityChange } : {})}
      columnOrder={tableState.columnOrder}
      {...(onColumnOrderChange ? { onColumnOrderChange } : {})}
      rowSelection={tableState.rowSelection}
      {...(onRowSelectionChange ? { onRowSelectionChange } : {})}
      expanded={tableState.expanded}
      {...(onExpandedChange ? { onExpandedChange } : {})}
      {...(checkbox !== undefined ? { checkbox } : {})}
      {...(!selection || selection.enabled === false
        ? {}
        : {
            selection: {
              enabled: selection?.enabled ?? true,
              getRowId,
              mode: selection?.mode ?? "multiple",
              preserveAcrossPages: selection?.preserveAcrossPages ?? false,
              ...(selection?.enableRowSelection
                ? { enableRowSelection: selection.enableRowSelection }
                : {}),
            },
          })}
      {...(bulkActions ? { bulkActions } : {})}
      {...(exportConfig ? { exportConfig } : {})}
      {...(reorder ? { reorder } : {})}
      {...(tableHierarchy ? { hierarchy: tableHierarchy } : {})}
      {...(enableColumnOrdering !== undefined ? { enableColumnOrdering } : {})}
      {...(!hideToolbar ? { renderToolbar: toolbar } : {})}
      {...(onTableReady ? { onTableReady } : {})}
      hidePagination={hidePagination}
      {...(density !== undefined ? { density } : {})}
      {...(onRowClick ? { onRowClick } : {})}
    />
  );
}
