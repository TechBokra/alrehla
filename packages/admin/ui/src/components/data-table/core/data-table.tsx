"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CornerDownRight, GripVertical } from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnOrderState,
  type ExpandedState,
  type Header,
  type HeaderGroup,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type Updater,
  type VisibilityState,
} from "@tanstack/react-table";
import { ChevronDown, ChevronRight } from "lucide-react";
import * as React from "react";
import { cn } from "../../../lib/utils";
import { EmptyState } from "../../feedback/empty-state";
import { ErrorState } from "../../feedback/error-state";
import {
  ResourceErrorBanner,
  ResourceErrorState,
} from "../../feedback/resource-error-state";
import { TableSkeleton } from "../../feedback/loading-state";
import { Alert, AlertDescription } from "../../ui/alert";
import { Button } from "../../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { DataTableToolbar } from "../actions/data-table-toolbar";
import {
  DataTableVisibleColumns,
  getDataTableSelectionColumn,
} from "../columns";
import { getDataTableReorderColumn } from "../columns/data-table-drag-handle";
import { DataTablePagination } from "../pagination/data-table-pagination";
import { DataTableSortableRow } from "../reorder";
import { reorderDataTableRows } from "../reorder/data-table-reorder";
import type { DataTableProps } from "./types";

const DEFAULT_PAGINATION: PaginationState = {
  pageIndex: 0,
  pageSize: 10,
};

function resolveStateUpdate<TState>(
  updater: Updater<TState>,
  current: TState
): TState {
  return typeof updater === "function"
    ? (updater as (state: TState) => TState)(current)
    : updater;
}

function hasColumnId<TData, TValue>(
  columns: ColumnDef<TData, TValue>[],
  id: string
) {
  return columns.some((column) => {
    if (column.id === id) return true;
    return "accessorKey" in column && String(column.accessorKey) === id;
  });
}

function getInitialExpandedState(
  initialExpanded: "all" | "none" | readonly string[] | undefined
): ExpandedState {
  if (initialExpanded === "all") return true;
  if (!Array.isArray(initialExpanded)) return {};

  return Object.fromEntries(initialExpanded.map((id) => [id, true]));
}

function getSelectedIds(selection: RowSelectionState) {
  return Object.entries(selection)
    .filter(([, selected]) => Boolean(selected))
    .map(([id]) => id);
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      "button, a, input, select, textarea, [role='button'], [role='checkbox'], [role='menuitem'], [data-prevent-row-click='true']"
    )
  );
}

export function DataTable<TData, TValue>({
  columns: userColumns,
  data,
  pageCount,
  rowCount,
  loading = false,
  error = null,
  onRetry,
  emptyTitle = "No results found",
  emptyDescription = "Try adjusting your search or filters to find what you are looking for.",
  emptyAction,
  emptyState,
  processingMode = "server",
  pageSizeOptions,
  isRefetching = false,
  partialError = null,
  errorState = null,
  partialErrorState = null,

  pagination: controlledPagination,
  onPaginationChange,
  sorting: controlledSorting,
  onSortingChange,
  columnFilters: controlledColumnFilters,
  onColumnFiltersChange,
  columnVisibility: controlledColumnVisibility,
  onColumnVisibilityChange,
  columnOrder: controlledColumnOrder,
  onColumnOrderChange,
  rowSelection: controlledRowSelection,
  onRowSelectionChange,
  expanded: controlledExpanded,
  onExpandedChange,

  getRowId: customGetRowId,
  selection,
  reorder,
  hierarchy,
  enableColumnOrdering = false,

  bulkActions = [],
  exportConfig,
  renderBulkActions,
  renderToolbar,
  onTableReady,
  hidePagination = false,
  hideToolbar = false,
  checkbox,

  density = "comfortable",

  searchKey,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  facetedFilters,

  onRowClick,
}: DataTableProps<TData, TValue>) {
  const isServerPagination = processingMode === "server";
  const selectionEnabled =
    checkbox !== undefined ? Boolean(checkbox) : Boolean(selection?.enabled);
  const reorderEnabled = Boolean(reorder?.enabled);
  const hierarchyEnabled = Boolean(hierarchy?.enabled);

  const getRowId = React.useCallback(
    (row: TData, index: number, parent?: Row<TData>) => {
      if (hierarchyEnabled && hierarchy?.enabled) {
        if (
          "getRowId" in hierarchy &&
          typeof hierarchy.getRowId === "function"
        ) {
          return hierarchy.getRowId(row);
        }
      }
      if (selectionEnabled && selection?.getRowId) {
        return selection.getRowId(row);
      }
      if (customGetRowId) {
        return customGetRowId(row);
      }
      if (typeof (row as { id?: unknown }).id === "string") {
        return (row as { id: string }).id;
      }
      if (typeof (row as { id?: unknown }).id === "number") {
        return String((row as { id: number }).id);
      }
      if (parent) {
        return `${parent.id}.${index}`;
      }
      return String(index);
    },
    [hierarchyEnabled, hierarchy, selectionEnabled, selection, customGetRowId]
  );

  const [uncontrolledPagination, setUncontrolledPagination] =
    React.useState<PaginationState>(DEFAULT_PAGINATION);
  const [uncontrolledSorting, setUncontrolledSorting] =
    React.useState<SortingState>([]);
  const [uncontrolledColumnFilters, setUncontrolledColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [uncontrolledColumnVisibility, setUncontrolledColumnVisibility] =
    React.useState<VisibilityState>({});
  const [uncontrolledColumnOrder, setUncontrolledColumnOrder] =
    React.useState<ColumnOrderState>([]);
  const [uncontrolledRowSelection, setUncontrolledRowSelection] =
    React.useState<RowSelectionState>({});
  const [uncontrolledExpanded, setUncontrolledExpanded] =
    React.useState<ExpandedState>(() =>
      getInitialExpandedState(hierarchy?.initialExpanded)
    );

  const pagination = controlledPagination ?? uncontrolledPagination;
  const sorting = controlledSorting ?? uncontrolledSorting;
  const columnFilters = controlledColumnFilters ?? uncontrolledColumnFilters;
  const columnVisibility =
    controlledColumnVisibility ?? uncontrolledColumnVisibility;
  const columnOrder = controlledColumnOrder ?? uncontrolledColumnOrder;
  const rowSelection = controlledRowSelection ?? uncontrolledRowSelection;
  const expanded = controlledExpanded ?? uncontrolledExpanded;

  const handlePaginationChange = React.useCallback(
    (updater: Updater<PaginationState>) => {
      const nextState = resolveStateUpdate(updater, pagination);
      if (onPaginationChange) {
        onPaginationChange(nextState);
      } else {
        setUncontrolledPagination(nextState);
      }
    },
    [pagination, onPaginationChange]
  );

  const handleSortingChange = React.useCallback(
    (updater: Updater<SortingState>) => {
      const nextState = resolveStateUpdate(updater, sorting);
      if (onSortingChange) {
        onSortingChange(nextState);
      } else {
        setUncontrolledSorting(nextState);
      }
    },
    [sorting, onSortingChange]
  );

  const handleColumnFiltersChange = React.useCallback(
    (updater: Updater<ColumnFiltersState>) => {
      const nextState = resolveStateUpdate(updater, columnFilters);
      if (onColumnFiltersChange) {
        onColumnFiltersChange(nextState);
      } else {
        setUncontrolledColumnFilters(nextState);
      }
    },
    [columnFilters, onColumnFiltersChange]
  );

  const handleColumnVisibilityChange = React.useCallback(
    (updater: Updater<VisibilityState>) => {
      const nextState = resolveStateUpdate(updater, columnVisibility);
      if (onColumnVisibilityChange) {
        onColumnVisibilityChange(nextState);
      } else {
        setUncontrolledColumnVisibility(nextState);
      }
    },
    [columnVisibility, onColumnVisibilityChange]
  );

  const handleColumnOrderChange = React.useCallback(
    (updater: Updater<ColumnOrderState>) => {
      const nextState = resolveStateUpdate(updater, columnOrder);
      if (onColumnOrderChange) {
        onColumnOrderChange(nextState);
      } else {
        setUncontrolledColumnOrder(nextState);
      }
    },
    [columnOrder, onColumnOrderChange]
  );

  const handleRowSelectionChange = React.useCallback(
    (updater: Updater<RowSelectionState>) => {
      const nextState = resolveStateUpdate(updater, rowSelection);
      if (onRowSelectionChange) {
        onRowSelectionChange(nextState);
      } else {
        setUncontrolledRowSelection(nextState);
      }
    },
    [rowSelection, onRowSelectionChange]
  );

  const handleExpandedChange = React.useCallback(
    (updater: Updater<ExpandedState>) => {
      const nextState = resolveStateUpdate(updater, expanded);
      if (onExpandedChange) {
        onExpandedChange(nextState);
      } else {
        setUncontrolledExpanded(nextState);
      }
    },
    [expanded, onExpandedChange]
  );

  const finalColumns = React.useMemo(() => {
    const columns: ColumnDef<TData, TValue>[] = [];

    if (selectionEnabled && !hasColumnId(userColumns, "select")) {
      columns.push(getDataTableSelectionColumn<TData, TValue>());
    }

    if (reorderEnabled && !hasColumnId(userColumns, "drag")) {
      columns.push(getDataTableReorderColumn<TData, TValue>());
    }

    if (
      hierarchyEnabled &&
      Boolean(
        (hierarchy as Record<string, unknown> | undefined)?.expandColumn
      ) &&
      !hasColumnId(userColumns, "expand")
    ) {
      columns.push({
        id: "expand",
        header: () => null,
        cell: ({ row }) => {
          if (!row.getCanExpand()) {
            return <div className="w-6" />;
          }

          return (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0"
              onClick={(event) => {
                event.stopPropagation();
                row.toggleExpanded();
              }}
            >
              {row.getIsExpanded() ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          );
        },
        enableSorting: false,
        enableHiding: false,
        size: 32,
      });
    }

    columns.push(...userColumns);
    return columns;
  }, [
    userColumns,
    reorderEnabled,
    selectionEnabled,
    hierarchyEnabled,
    hierarchy,
  ]);

  const effectiveColumnOrder = React.useMemo(() => {
    if (!columnOrder || columnOrder.length === 0) return undefined;

    const leading: string[] = [];
    if (selectionEnabled) leading.push("select");
    if (reorderEnabled) leading.push("drag");
    if (
      hierarchyEnabled &&
      Boolean((hierarchy as Record<string, unknown> | undefined)?.expandColumn)
    ) {
      leading.push("expand");
    }

    const middle = columnOrder.filter(
      (id) => !leading.includes(id) && id !== "actions"
    );

    const userColumnIds = userColumns
      .map(
        (c) =>
          c.id ??
          (typeof (c as { accessorKey?: unknown }).accessorKey === "string"
            ? (c as { accessorKey: string }).accessorKey
            : undefined)
      )
      .filter(
        (id): id is string =>
          Boolean(id) && !leading.includes(id as string) && id !== "actions"
      );

    for (const id of userColumnIds) {
      if (!middle.includes(id)) {
        middle.push(id);
      }
    }

    const trailing: string[] = [];
    if (userColumns.some((c) => c.id === "actions")) {
      trailing.push("actions");
    }

    return [...leading, ...middle, ...trailing];
  }, [
    columnOrder,
    selectionEnabled,
    reorderEnabled,
    hierarchyEnabled,
    hierarchy,
    userColumns,
  ]);

  const table = useReactTable<TData>({
    data,
    columns: finalColumns,
    ...(isServerPagination && pageCount !== undefined ? { pageCount } : {}),
    getRowId,
    ...(hierarchyEnabled && hierarchy?.getSubRows
      ? { getSubRows: hierarchy.getSubRows }
      : {}),
    state: {
      pagination,
      sorting,
      columnFilters,
      columnVisibility,
      columnOrder: effectiveColumnOrder ?? columnOrder,
      rowSelection,
      expanded,
    },

    onPaginationChange: handlePaginationChange,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: handleColumnFiltersChange,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onColumnOrderChange: handleColumnOrderChange,
    onRowSelectionChange: handleRowSelectionChange,
    onExpandedChange: handleExpandedChange,

    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(isServerPagination
      ? {}
      : { getPaginationRowModel: getPaginationRowModel() }),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getExpandedRowModel: getExpandedRowModel(),

    manualPagination: isServerPagination,
    manualSorting: isServerPagination,
    manualFiltering: isServerPagination,
    enableRowSelection: selectionEnabled
      ? selection?.enableRowSelection
        ? (row: Row<TData>) => selection.enableRowSelection!(row.original)
        : true
      : false,
    enableMultiRowSelection: selectionEnabled
      ? selection?.mode !== "single"
      : false,
  });

  const [activeDragId, setActiveDragId] = React.useState<string | null>(null);
  const [overDropId, setOverDropId] = React.useState<string | null>(null);
  const [dropPosition, setDropPosition] = React.useState<
    "before" | "after" | "inside" | null
  >(null);

  const activeDragRow = React.useMemo(
    () =>
      activeDragId
        ? (table.getRowModel().rows.find((row) => row.id === activeDragId) ??
          null)
        : null,
    [activeDragId, table]
  );

  const overDropRow = React.useMemo(
    () =>
      overDropId
        ? (table.getRowModel().rows.find((row) => row.id === overDropId) ??
          null)
        : null,
    [overDropId, table]
  );

  React.useEffect(() => {
    onTableReady?.(table);
    return () => {
      onTableReady?.(null);
    };
  }, [table, onTableReady]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
    setOverDropId(null);
    setDropPosition(null);
  }, []);

  const handleDragOver = React.useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        setOverDropId(null);
        setDropPosition(null);
        return;
      }

      const overId = String(over.id);
      setOverDropId(overId);

      const canNest = hierarchyEnabled && reorder?.allowNest !== false;
      if (canNest) {
        setDropPosition("inside");
      } else {
        setDropPosition("after");
      }
    },
    [hierarchyEnabled, reorder?.allowNest]
  );

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const finalPosition =
        dropPosition ?? (hierarchyEnabled ? "inside" : "after");

      setActiveDragId(null);
      setOverDropId(null);
      setDropPosition(null);

      if (!over || active.id === over.id) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      const activeRow = table
        .getRowModel()
        .rows.find((row) => row.id === activeId);
      const overRow = table.getRowModel().rows.find((row) => row.id === overId);

      if (!activeRow || !overRow) return;

      if (reorder?.canDrag && !reorder.canDrag(activeRow.original)) return;
      if (
        reorder?.canDrop &&
        !reorder.canDrop(activeRow.original, overRow.original, finalPosition)
      ) {
        return;
      }

      const isNest = finalPosition === "inside";

      // Prevent cyclic nesting if target is descendant of active
      if (isNest) {
        const activeOrig = activeRow.original as {
          descendantIds?: string[];
          id?: string;
        };
        if (activeOrig.descendantIds?.includes(overId)) {
          return;
        }
        if (
          reorder?.canNest &&
          !reorder.canNest(activeRow.original, overRow.original)
        ) {
          return;
        }

        // Auto-expand the target parent row so the new child is immediately visible!
        if (onExpandedChange) {
          const currentExp =
            typeof expanded === "object" && expanded !== null ? expanded : {};
          onExpandedChange({
            ...currentExp,
            [overId]: true,
          });
        } else {
          setUncontrolledExpanded((prev) => {
            const currentExp =
              typeof prev === "object" && prev !== null ? prev : {};
            return {
              ...currentExp,
              [overId]: true,
            };
          });
        }
      }

      if (isNest && reorder?.onNest) {
        void reorder.onNest({
          activeId,
          targetParentId: overId,
          active: activeRow.original,
          targetParent: overRow.original,
        });
        return;
      }

      if (reorder?.onMove) {
        void reorder.onMove({
          activeId,
          overId,
          active: activeRow.original,
          over: overRow.original,
          position: finalPosition,
          isNest,
          targetParentId: isNest ? overId : undefined,
        });
        return;
      }

      if (reorder?.onReorder) {
        const nextRows = reorderDataTableRows(data, activeId, overId, (row) =>
          getRowId(row, 0)
        );
        void reorder.onReorder(nextRows, {
          activeId,
          overId,
          position: finalPosition,
        });
      }
    },
    [
      table,
      reorder,
      data,
      getRowId,
      dropPosition,
      hierarchyEnabled,
      onExpandedChange,
      expanded,
    ]
  );

  if (error) {
    return (
      <div className="rounded-xl border p-6 bg-card">
        {errorState ? (
          <ResourceErrorState state={errorState} onRetry={onRetry} />
        ) : (
          <ErrorState
            title="Failed to load data"
            description={error.message}
            {...(onRetry ? { onRetry } : {})}
          />
        )}
      </div>
    );
  }

  const selectedRows = table
    .getSelectedRowModel()
    .rows.map((row) => row.original);
  const selectedIds = getSelectedIds(rowSelection);
  const showBulkActions =
    selectionEnabled && (selectedRows.length > 0 || selectedIds.length > 0);

  const rows = table.getRowModel().rows;
  const visibleColumnCount = Math.max(table.getVisibleLeafColumns().length, 1);
  const tableMarkup = (
    <>
      <Table className="w-full bg-background">
        <TableHeader className="bg-background border-b border-border/70">
          {table.getHeaderGroups().map((headerGroup: HeaderGroup<TData>) => (
            <TableRow
              key={headerGroup.id}
              className="hover:bg-transparent bg-background"
            >
              {headerGroup.headers.map(
                (header: Header<TData, unknown>, index: number) => {
                  const isLastColumn = index === headerGroup.headers.length - 1;
                  const densityHeadClass =
                    density === "compact"
                      ? "h-9 px-4 py-2 text-[11px]"
                      : density === "spacious"
                        ? "h-13 px-6 py-4 text-xs"
                        : "h-11 px-6 py-3 text-xs";

                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        densityHeadClass,
                        "font-semibold text-muted-foreground uppercase tracking-wider"
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center justify-between gap-2",
                          !isLastColumn && "w-full"
                        )}
                      >
                        <div className="flex-1 truncate">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </div>
                        {isLastColumn && (
                          <DataTableVisibleColumns
                            table={table}
                            label=""
                            triggerVariant="ghost"
                            triggerSize="icon"
                            className="h-6 w-6 p-0 hover:bg-muted"
                          />
                        )}
                      </div>
                    </TableHead>
                  );
                }
              )}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className="divide-y divide-border/40 bg-background">
          {loading ? (
            <TableSkeleton columns={visibleColumnCount} rows={5} />
          ) : rows.length ? (
            rows.map((row: Row<TData>) => {
              const densityCellClass =
                density === "compact"
                  ? "px-4 py-1.5 text-xs"
                  : density === "spacious"
                    ? "px-6 py-4 text-sm"
                    : "px-6 py-3.5 text-sm";

              const cells = row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className={densityCellClass}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ));

              if (reorderEnabled) {
                const isOver = overDropId === row.id && activeDragId !== row.id;
                const isDescendantOrSelf =
                  activeDragId === row.id ||
                  Boolean(
                    (
                      activeDragRow?.original as {
                        descendantIds?: string[];
                      }
                    )?.descendantIds?.includes(row.id)
                  );

                return (
                  <DataTableSortableRow
                    key={row.id}
                    row={row}
                    disabled={reorder?.canDrag?.(row.original) === false}
                    onRowClick={onRowClick}
                    isDropTarget={isOver}
                    dropPosition={isOver ? dropPosition : null}
                    isDropForbidden={isOver && isDescendantOrSelf}
                  >
                    {cells}
                  </DataTableSortableRow>
                );
              }

              return (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  data-depth={row.depth}
                  onClick={(event) => {
                    if (isInteractiveTarget(event.target)) return;
                    onRowClick?.(row.original);
                  }}
                  className={cn(
                    "transition-colors border-b border-border/40 hover:bg-muted/40 bg-background",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {cells}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={visibleColumnCount}
                className="h-64 text-center"
              >
                {emptyState ?? (
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                  />
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );

  return (
    <div className="space-y-4 w-full bg-background p-1 rounded-xl">
      {partialErrorState ? (
        <ResourceErrorBanner state={partialErrorState} onRetry={onRetry} />
      ) : partialError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {partialError.message ||
              "Some table features failed to load completely. Showing cached or partial results."}
          </AlertDescription>
        </Alert>
      ) : null}

      {renderToolbar ? (
        renderToolbar(table)
      ) : !hideToolbar ? (
        <DataTableToolbar
          table={table}
          searchKey={searchKey}
          searchPlaceholder={searchPlaceholder}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          facetedFilters={facetedFilters}
        />
      ) : null}

      {renderBulkActions ? renderBulkActions(table) : null}

      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-border/80 bg-background text-foreground shadow-xs transition-opacity",
          isRefetching && "opacity-70"
        )}
      >
        {reorderEnabled ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={rows.map((row) => row.id)}
              strategy={verticalListSortingStrategy}
            >
              {tableMarkup}
            </SortableContext>

            <DragOverlay>
              {activeDragRow ? (
                <div className="flex items-center gap-2 rounded-lg border border-primary bg-card px-4 py-2.5 text-xs font-semibold text-card-foreground shadow-2xl backdrop-blur-md opacity-95">
                  <GripVertical className="h-4 w-4 text-primary" />
                  <span className="max-w-[200px] truncate font-medium">
                    {String(
                      (
                        activeDragRow.original as {
                          name?: string;
                          title?: string;
                        }
                      ).name ??
                        (activeDragRow.original as { title?: string }).title ??
                        activeDragRow.id
                    )}
                  </span>
                  {dropPosition === "inside" && overDropRow && (
                    <span className="flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground shadow-xs animate-pulse">
                      <CornerDownRight className="h-3 w-3" />
                      Make child of{" "}
                      {String(
                        (
                          overDropRow.original as {
                            name?: string;
                            title?: string;
                          }
                        ).name ??
                          (overDropRow.original as { title?: string }).title ??
                          overDropRow.id
                      )}
                    </span>
                  )}
                  {dropPosition === "before" && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      Insert above
                    </span>
                  )}
                  {dropPosition === "after" && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      Insert below
                    </span>
                  )}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          tableMarkup
        )}
      </div>

      {!hidePagination && (
        <DataTablePagination
          table={table}
          {...(rowCount !== undefined ? { rowCount } : {})}
          {...(pageSizeOptions ? { pageSizeOptions } : {})}
        />
      )}
    </div>
  );
}
