"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { Button } from "../../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { serializeDataViewCsv } from "./data-view-csv";
import type {
  DataViewExportConfig,
  DataViewExportContext,
  DataViewExportMode,
  DataViewState,
  ResourceSelection,
} from "@eng-mohamedelsayed/admin-core/data-view";
import { createResourceSelection } from "@eng-mohamedelsayed/admin-core/data-view";
import { getDataViewTableState } from "@eng-mohamedelsayed/admin-core/data-view";

const MODE_LABEL: Record<DataViewExportMode, string> = {
  "current-page": "Export current page",
  selected: "Export selected rows",
  filtered: "Export filtered results",
  all: "Export all",
};

function downloadCsv(contents: string, filename: string) {
  const normalizedFilename = filename.toLocaleLowerCase().endsWith(".csv")
    ? filename
    : `${filename}.csv`;
  const url = URL.createObjectURL(
    new Blob([contents], { type: "text/csv;charset=utf-8" })
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = normalizedFilename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function flattenExportRows<TData>(
  rows: readonly TData[] | null | undefined,
  getRowId: (row: TData) => string,
  getSubRows?: ((row: TData) => readonly TData[] | undefined) | undefined
): TData[] {
  if (!Array.isArray(rows)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[DataViewExport] Expected rows array", rows);
    }
    return [];
  }

  if (!getSubRows) return [...rows];

  const flattened: TData[] = [];
  const visitedRows = new Set<TData>();
  const visitedIds = new Set<string>();
  const pending = [...rows].reverse();

  while (pending.length > 0) {
    const row = pending.pop();
    if (row === undefined || visitedRows.has(row)) continue;
    visitedRows.add(row);

    let id: string | null = null;
    try {
      const candidate = getRowId(row);
      id = candidate ? candidate : null;
    } catch {
      // A malformed row should not make a cyclic hierarchy crash the view.
    }

    if (id && visitedIds.has(id)) continue;
    if (id) visitedIds.add(id);
    flattened.push(row);

    try {
      const children = getSubRows(row);
      if (Array.isArray(children) && children.length) {
        pending.push(...children.slice().reverse());
      }
    } catch {
      // Treat a resource-owned child resolver failure as a leaf row.
    }
  }

  return flattened;
}

export function DataViewExportMenu<TData>({
  config,
  data,
  state,
  selection: selectionState,
  getRowId,
  getSubRows,
}: {
  config: DataViewExportConfig<TData>;
  data: readonly TData[];
  state: DataViewState;
  selection?: ResourceSelection;
  getRowId: (row: TData) => string;
  getSubRows?: (row: TData) => readonly TData[] | undefined;
}) {
  const [pendingMode, setPendingMode] =
    React.useState<DataViewExportMode | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const selection =
    selectionState ??
    createResourceSelection(getDataViewTableState(state).rowSelection);
  const selectedIds = selection.selectedIds;
  const executeIds = selection.executeIds;
  const selectedIdSet = React.useMemo(() => new Set(executeIds), [executeIds]);
  const currentRows = React.useMemo(
    () => flattenExportRows(data, getRowId, getSubRows),
    [data, getRowId, getSubRows]
  );
  const selectedRows = React.useMemo(
    () => currentRows.filter((row) => selectedIdSet.has(getRowId(row))),
    [currentRows, getRowId, selectedIdSet]
  );

  const runExport = async (mode: DataViewExportMode) => {
    const context: DataViewExportContext<TData> = {
      mode,
      state,
      currentRows,
      selectedIds,
      executeIds,
      selectedRows,
    };
    setPendingMode(mode);
    setError(null);
    try {
      let rows: TData[];
      if (mode === "current-page") {
        rows = currentRows;
      } else if (
        mode === "selected" &&
        selectedRows.length === executeIds.length
      ) {
        rows = selectedRows;
      } else if (config.fetchRows) {
        const fetchedRows = flattenExportRows(
          await config.fetchRows(context),
          getRowId,
          getSubRows
        );
        if (mode === "selected") {
          rows = fetchedRows.filter((row) => selectedIdSet.has(getRowId(row)));
          if (rows.length !== executeIds.length) {
            throw new Error(
              "The selected export could not load every explicitly selected record."
            );
          }
        } else rows = fetchedRows;
      } else {
        throw new Error(
          `Export mode “${MODE_LABEL[mode]}” requires a resource fetch adapter.`
        );
      }

      const filename =
        typeof config.filename === "function"
          ? config.filename(context)
          : config.filename;
      downloadCsv(serializeDataViewCsv(rows, config.columns), filename);
    } catch (caught: unknown) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The CSV export could not be created."
      );
    } finally {
      setPendingMode(null);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pendingMode !== null}
          >
            <Download data-icon="inline-start" />
            {pendingMode ? "Exporting…" : "Export"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>CSV export</DropdownMenuLabel>
          <DropdownMenuGroup>
            {config.modes.map((mode) => (
              <DropdownMenuItem
                key={mode}
                disabled={
                  (mode === "selected" && executeIds.length === 0) ||
                  ((mode === "filtered" || mode === "all") && !config.fetchRows)
                }
                onSelect={() => void runExport(mode)}
              >
                {MODE_LABEL[mode]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {error ? (
        <span role="alert" className="max-w-64 text-xs text-destructive">
          {error}
        </span>
      ) : null}
    </div>
  );
}
