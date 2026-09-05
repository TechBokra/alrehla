"use client";

import * as React from "react";
import type { Column, Table } from "@tanstack/react-table";
import { Columns, RotateCcw, SlidersHorizontal } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Checkbox } from "../../ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "../../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";

export interface DataTableVisibleColumnsProps<TData> {
  table: Table<TData>;
  label?: string;
  align?: "start" | "center" | "end";
  enableSearch?: boolean;
  getColumnLabel?: (column: Column<TData, unknown>) => string;
  className?: string;
  triggerVariant?: "outline" | "ghost" | "default" | "secondary";
  triggerSize?: "default" | "sm" | "lg" | "icon";
  triggerIcon?: React.ReactNode;
}

export function DataTableVisibleColumns<TData>({
  table,
  label = "Columns",
  align = "end",
  enableSearch = true,
  getColumnLabel,
  className,
  triggerVariant = "outline",
  triggerSize = "sm",
  triggerIcon = <SlidersHorizontal className="h-4 w-4" />,
}: DataTableVisibleColumnsProps<TData>) {
  const [open, setOpen] = React.useState(false);

  const configurableColumns = React.useMemo(() => {
    return table
      .getAllLeafColumns()
      .filter(
        (column) =>
          typeof column.accessorFn !== "undefined" && column.getCanHide()
      );
  }, [table]);

  const visibleColumns = React.useMemo(() => {
    return configurableColumns.filter((column) => column.getIsVisible());
  }, [configurableColumns]);

  const getLabel = React.useCallback(
    (column: Column<TData, unknown>): string => {
      if (getColumnLabel) return getColumnLabel(column);
      if (typeof column.columnDef.header === "string") {
        return column.columnDef.header;
      }
      return column.id.replace(/_/g, " ");
    },
    [getColumnLabel]
  );

  if (configurableColumns.length === 0) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={triggerVariant}
          size={triggerSize}
          className={cn(
            triggerSize === "icon" ? "h-7 w-7 p-0" : "h-8 gap-2 border-dashed",
            className
          )}
          aria-label={label ? undefined : "Toggle visible columns"}
        >
          {triggerIcon || <Columns className="h-4 w-4" />}
          {label ? <span>{label}</span> : null}
          {label ? (
            <Badge
              variant="secondary"
              className="ml-1 rounded-sm px-1.5 font-normal text-xs"
            >
              {visibleColumns.length}/{configurableColumns.length}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align={align}
        className="w-[230px] p-0"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          {enableSearch && (
            <CommandInput placeholder="Filter columns..." className="h-9" />
          )}

          <CommandList>
            <CommandEmpty>No columns found.</CommandEmpty>

            <CommandGroup>
              {configurableColumns.map((column) => {
                const isVisible = column.getIsVisible();
                const columnTitle = getLabel(column);

                return (
                  <CommandItem
                    key={column.id}
                    onSelect={() => column.toggleVisibility(!isVisible)}
                    className="flex items-center gap-2 capitalize cursor-pointer"
                  >
                    <Checkbox
                      checked={isVisible}
                      onCheckedChange={(checked) =>
                        column.toggleVisibility(!!checked)
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="truncate">{columnTitle}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
