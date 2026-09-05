"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "../../ui/checkbox";

/**
 * A reusable current-page selection column. The table must be configured with
 * a stable getRowId before this column is used.
 */
export function getDataTableSelectionColumn<
  TData,
  TValue = unknown,
>(): ColumnDef<TData, TValue> {
  return {
    id: "select",
    header: ({ table }) => (
      <div onClick={(event) => event.stopPropagation()}>
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(Boolean(value))
          }
          aria-label="Select all rows on this page"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div onClick={(event) => event.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
          aria-label={`Select row ${row.id}`}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  };
}
