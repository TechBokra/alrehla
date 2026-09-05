"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../core/data-table-header";

export interface DataTableOrderColumnOptions<TData> {
  id?: string;
  accessorKey?: string;
  title?: string;
  size?: number;
  enableSorting?: boolean;
  renderValue?: (value: number | undefined, row: TData) => React.ReactNode;
}

export function getDataTableOrderColumn<TData, TValue = number>({
  id = "order",
  accessorKey = "rank",
  title = "Order",
  size = 70,
  enableSorting = true,
  renderValue,
}: DataTableOrderColumnOptions<TData> = {}): ColumnDef<TData, TValue> {
  return {
    id,
    accessorKey,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={title} />
    ),
    cell: ({ row, getValue }) => {
      const val = getValue() as number | undefined;
      if (renderValue) return renderValue(val, row.original);
      return (
        <span className="font-mono text-xs font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border">
          {val ?? 0}
        </span>
      );
    },
    enableSorting,
    size,
  };
}
