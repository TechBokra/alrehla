import * as React from 'react';
import { flexRender, type Table as TanStackTable } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { EmptyState } from '../layout/empty-state';
import { cn } from '../../lib/utils';

export interface DataTableProps<TData> extends React.HTMLAttributes<HTMLDivElement> {
  table: TanStackTable<TData>;
  emptyMessage?: React.ReactNode;
  emptyState?: React.ReactNode;
  toolbar?: React.ReactNode;
}

function DataTable<TData>({ table, emptyMessage = 'No results found.', emptyState, toolbar, className, ...props }: DataTableProps<TData>) {
  const rows = table.getRowModel().rows;
  const visibleColumns = table.getVisibleLeafColumns().length || 1;

  return (
    <div className={cn('space-y-4', className)} {...props}>
      {toolbar}
      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={visibleColumns} className="h-32 text-center">
                  {emptyState ?? <EmptyState title={emptyMessage} className="border-0 bg-transparent p-4" />}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export { DataTable };
