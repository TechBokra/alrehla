'use client';

import * as React from 'react';
import { flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type ColumnDef, type Table as TanStackTable, type Updater } from '@tanstack/react-table';
import { useResource } from '@alrehla/admin-core/resource';
import { resolveResourceRowActions } from '@alrehla/admin-core/resource';
import type { ResourceRowAction } from '@alrehla/admin-core/resource';
import { Checkbox } from '../ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { EmptyState } from '../layout/empty-state';
import { cn } from '../../lib/utils';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';

function resolveUpdater<T>(updater: Updater<T>, current: T): T { return typeof updater === 'function' ? (updater as (value: T) => T)(current) : updater; }

function RowActions<TData>({ record, singularLabel, onEdit, onDelete, actions, renderExtra }: { record: TData; singularLabel: string; onEdit?: (record: TData) => void; onDelete?: (record: TData) => void; actions: readonly ResourceRowAction<TData>[]; renderExtra?: (record: TData) => React.ReactNode }) {
  if (!onEdit && !onDelete && !actions.length && !renderExtra) return null;
  return <div className="flex items-center justify-end gap-1">{renderExtra?.(record)}{actions.length || onEdit || onDelete ? <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="فتح الإجراءات"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">{actions.map((action) => <DropdownMenuItem key={action.id} onClick={() => void action.onSelect(record)} className={action.destructive ? 'text-destructive' : undefined}>{action.icon ? <action.icon className="me-2 h-4 w-4" /> : null}{action.label}</DropdownMenuItem>)}{actions.length > 0 && (onEdit || onDelete) ? <DropdownMenuSeparator /> : null}{onEdit ? <DropdownMenuItem onClick={() => onEdit(record)}><Pencil className="me-2 h-4 w-4" />تعديل {singularLabel}</DropdownMenuItem> : null}{onEdit && onDelete ? <DropdownMenuSeparator /> : null}{onDelete ? <DropdownMenuItem onClick={() => onDelete(record)} className="text-destructive"><Trash2 className="me-2 h-4 w-4" />حذف {singularLabel}</DropdownMenuItem> : null}</DropdownMenuContent></DropdownMenu> : null}</div>;
}

export function ResourceDataView<TData = unknown>({ renderRowActions, emptyState }: { renderRowActions?: (record: TData) => React.ReactNode; emptyState?: React.ReactNode } = {}) {
  const { definition, dataView, capabilities, openDelete, openUpdate, setDataTable, density } = useResource<TData>();
  const resolvedActions = resolveResourceRowActions(definition, capabilities);
  const columns = React.useMemo<ColumnDef<TData, unknown>[]>(() => {
    const hasActions = resolvedActions.edit || resolvedActions.delete || resolvedActions.actions.length || renderRowActions;
    if (!hasActions) return definition.dataView.columns as ColumnDef<TData, unknown>[];
    return [...definition.dataView.columns as ColumnDef<TData, unknown>[], { id: 'resource-actions', header: () => <span className="sr-only">إجراءات</span>, enableHiding: false, enableSorting: false, cell: ({ row }) => <RowActions record={row.original} singularLabel={definition.metadata.singularLabel} {...(resolvedActions.edit ? { onEdit: openUpdate } : {})} {...(resolvedActions.delete ? { onDelete: openDelete } : {})} actions={resolvedActions.actions} renderExtra={renderRowActions} /> }];
  }, [definition.dataView.columns, definition.metadata.singularLabel, openDelete, openUpdate, renderRowActions, resolvedActions]);
  const server = definition.dataView.processingMode === 'server';
  const table = useReactTable({
    data: dataView.data as TData[],
    columns,
    state: { pagination: dataView.state.pagination, sorting: dataView.state.sorting, columnVisibility: dataView.state.columnVisibility, columnOrder: dataView.state.columnOrder, rowSelection: dataView.state.rowSelection },
    getRowId: definition.dataView.getRowId,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    ...(server ? {} : { getSortedRowModel: getSortedRowModel() }),
    manualPagination: server,
    manualSorting: server,
    pageCount: server ? dataView.pageCount : undefined,
    enableRowSelection: capabilities.selection,
    onPaginationChange: (updater) => dataView.onPaginationChange(resolveUpdater(updater, dataView.state.pagination)),
    onSortingChange: (updater) => dataView.onSortingChange(resolveUpdater(updater, dataView.state.sorting)),
    onColumnVisibilityChange: (updater) => dataView.onColumnVisibilityChange(resolveUpdater(updater, dataView.state.columnVisibility)),
    onColumnOrderChange: (updater) => dataView.onColumnOrderChange(resolveUpdater(updater, dataView.state.columnOrder)),
    onRowSelectionChange: (updater) => dataView.onRowSelectionChange(resolveUpdater(updater, dataView.state.rowSelection)),
  });
  React.useEffect(() => setDataTable(table as TanStackTable<TData>), [setDataTable, table]);
  const rows = table.getRowModel().rows;
  const cellPadding = density === 'compact' ? 'py-2' : density === 'spacious' ? 'py-5' : 'py-3';
  return <div className="overflow-x-auto rounded-xl border bg-background shadow-sm"><Table className="min-w-[760px]"><TableHeader><TableRow className="bg-muted/40">{capabilities.selection ? <TableHead className="w-12 text-center"><Checkbox checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() ? 'indeterminate' : false)} onCheckedChange={(checked) => table.toggleAllPageRowsSelected(!!checked)} aria-label="تحديد الكل" /></TableHead> : null}{table.getHeaderGroups().map((headerGroup) => headerGroup.headers.map((header) => <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>))}</TableRow></TableHeader><TableBody>{dataView.loading && rows.length === 0 ? <TableRow><TableCell colSpan={columns.length + (capabilities.selection ? 1 : 0)} className="h-40 text-center text-muted-foreground">جارٍ تحميل البيانات...</TableCell></TableRow> : rows.length ? rows.map((row) => <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>{capabilities.selection ? <TableCell className="text-center"><Checkbox checked={row.getIsSelected()} onCheckedChange={(checked) => row.toggleSelected(!!checked)} aria-label="تحديد الصف" /></TableCell> : null}{row.getVisibleCells().map((cell) => <TableCell key={cell.id} className={cn('text-sm', cellPadding)}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={columns.length + (capabilities.selection ? 1 : 0)} className="h-40 text-center">{emptyState ?? <EmptyState title="لا توجد نتائج" className="border-0 p-4" />}</TableCell></TableRow>}</TableBody></Table></div>;
}
