"use client";

import * as React from "react";
import type { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { DataTableFacetedFilter } from "../filters/data-table-faceted-filter";
import type { FacetedFilterConfig } from "@eng-mohamedelsayed/admin-core/data-view";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchPlaceholder?: string | undefined;
  searchKey?: string | undefined;
  searchValue?: string | undefined;
  onSearchChange?: ((value: string) => void) | undefined;
  facetedFilters?: FacetedFilterConfig[] | undefined;
  renderActions?: ((table: Table<TData>) => React.ReactNode) | undefined;
}

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder = "Search...",
  searchKey,
  searchValue,
  onSearchChange,
  facetedFilters = [],
  renderActions,
}: DataTableToolbarProps<TData>) {
  const isFiltered =
    table.getState().columnFilters.length > 0 || !!searchValue;

  const searchColumn = React.useMemo(() => {
    if (!searchKey) return null;
    return (
      table.getAllColumns().find((column) => column.id === searchKey) ?? null
    );
  }, [table, searchKey]);

  const hasSearch = Boolean(onSearchChange || searchColumn);
  const hasFacetedFilters = facetedFilters.length > 0;
  const hasActions = Boolean(renderActions);

  if (!hasSearch && !hasFacetedFilters && !hasActions && !isFiltered) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {onSearchChange ? (
          <Input
            placeholder={searchPlaceholder}
            value={searchValue ?? ""}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
          />
        ) : searchColumn ? (
          <Input
            placeholder={searchPlaceholder}
            value={(searchColumn.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              searchColumn.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />
        ) : null}

        {facetedFilters.map((config) => {
          const column = table
            .getAllColumns()
            .find((col) => col.id === config.id);
          if (!column) return null;
          return (
            <DataTableFacetedFilter
              key={config.id}
              column={column}
              title={config.title}
              options={config.options}
            />
          );
        })}

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters();
              onSearchChange?.("");
            }}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {renderActions?.(table)}
      </div>
    </div>
  );
}
