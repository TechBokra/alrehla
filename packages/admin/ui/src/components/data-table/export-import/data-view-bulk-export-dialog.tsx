"use client";

import * as React from "react";
import {
  Download,
  Printer,
  CheckSquare,
  Square,
  Search,
  FileSpreadsheet,
  Layers,
  AlertCircle,
} from "lucide-react";
import { Button } from "../../ui/button";
import { Checkbox } from "../../ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Spinner } from "../../ui/spinner";
import {
  downloadCsv,
  printDataViewTable,
  serializeDataViewCsv,
} from "./data-view-csv";
import type {
  DataViewExportColumn,
  DataViewExportConfig,
  DataViewExportContext,
  DataViewState,
  ResourceSelection,
} from "@eng-mohamedelsayed/admin-core/data-view";
import { createDataViewState } from "@eng-mohamedelsayed/admin-core/data-view";

export interface DataViewBulkExportDialogProps<TData> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: DataViewExportConfig<TData>;
  rows: TData[];
  selectedIds?: string[] | undefined;
  executeIds?: string[] | undefined;
  selection?: ResourceSelection | undefined;
  state?: DataViewState | undefined;
  title?: string | undefined;
  description?: string | undefined;
  defaultAction?: "export" | "print" | undefined;
  onExportComplete?: (() => void) | undefined;
}

export function DataViewBulkExportDialog<TData>({
  open,
  onOpenChange,
  config,
  rows,
  selectedIds = [],
  executeIds = selectedIds,
  selection,
  state,
  title,
  description,
  defaultAction = "export",
  onExportComplete,
}: DataViewBulkExportDialogProps<TData>) {
  const allColumns = config.columns;

  // Selected column keys state (all selected by default)
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(
    () => new Set(allColumns.map((col) => col.key))
  );

  // Field search query
  const [searchQuery, setSearchQuery] = React.useState("");

  // Export filename state
  const defaultFilename = React.useMemo(() => {
    if (typeof config.filename === "function") {
      const context: DataViewExportContext<TData> = {
        mode: "selected",
        state: state ?? createDataViewState(),
        currentRows: rows,
        selectedIds,
        executeIds: selection?.executeIds ?? executeIds,
        selectedRows: rows,
      };
      return config.filename(context);
    }
    return (
      config.filename || `export-${new Date().toISOString().slice(0, 10)}.csv`
    );
  }, [config, executeIds, rows, selectedIds, selection, state]);

  const [filename, setFilename] = React.useState(defaultFilename);
  const [isExporting, setIsExporting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset state when opening dialog
  React.useEffect(() => {
    if (open) {
      setSelectedKeys(new Set(allColumns.map((col) => col.key)));
      setSearchQuery("");
      setFilename(defaultFilename);
      setError(null);
    }
  }, [open, allColumns, defaultFilename]);

  const filteredColumns = React.useMemo(() => {
    if (!searchQuery.trim()) return allColumns;
    const q = searchQuery.toLowerCase();
    return allColumns.filter(
      (col) =>
        col.label.toLowerCase().includes(q) || col.key.toLowerCase().includes(q)
    );
  }, [allColumns, searchQuery]);

  const handleToggleColumn = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedKeys(new Set(allColumns.map((col) => col.key)));
  };

  const handleDeselectAll = () => {
    setSelectedKeys(new Set());
  };

  const selectedColumns = React.useMemo(
    () => allColumns.filter((col) => selectedKeys.has(col.key)),
    [allColumns, selectedKeys]
  );

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      setError("Please select at least one field to export.");
      return;
    }
    if (rows.length === 0 || rows.length !== executeIds.length) {
      setError(
        rows.length === 0
          ? "No records selected for export."
          : "Every explicitly selected record must be loaded before export."
      );
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const csvContent = serializeDataViewCsv(rows, selectedColumns);
      downloadCsv(csvContent, filename);
      onExportComplete?.();
      onOpenChange(false);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to generate CSV export."
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    if (selectedColumns.length === 0) {
      setError("Please select at least one field to print.");
      return;
    }
    if (rows.length === 0 || rows.length !== executeIds.length) {
      setError(
        rows.length === 0
          ? "No records selected for printing."
          : "Every explicitly selected record must be loaded before printing."
      );
      return;
    }

    try {
      printDataViewTable(rows, selectedColumns, title || "Exported Records");
      onExportComplete?.();
      onOpenChange(false);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to generate print layout."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="space-y-1 pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            {title || "Export records"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {description || (
              <>
                Selected{" "}
                <span className="font-semibold text-foreground">
                  {rows.length}
                </span>{" "}
                record{rows.length === 1 ? "" : "s"}. Choose the fields to
                include in your export or printout.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4 py-1 flex-1 overflow-y-auto pr-1">
          {/* Filename Input */}
          <div className="space-y-1.5">
            <Label
              htmlFor="export-filename"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              CSV File Name
            </Label>
            <Input
              id="export-filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="export.csv"
              className="h-8 text-sm"
            />
          </div>

          {/* Field Selection Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Fields to include ({selectedKeys.size} of {allColumns.length})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <CheckSquare className="h-3 w-3 mr-1" />
                  Select all
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDeselectAll}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Square className="h-3 w-3 mr-1" />
                  Deselect all
                </Button>
              </div>
            </div>

            {/* Field Search */}
            {allColumns.length > 6 && (
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  placeholder="Filter fields..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
            )}

            {/* Columns Grid / Checkbox list */}
            <div className="rounded-md border bg-muted/20 p-2 max-h-56 overflow-y-auto space-y-1">
              {filteredColumns.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No matching fields found.
                </div>
              ) : (
                filteredColumns.map((column) => {
                  const isChecked = selectedKeys.has(column.key);
                  return (
                    <label
                      key={column.key}
                      className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs hover:bg-muted/50 cursor-pointer transition-colors select-none"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => handleToggleColumn(column.key)}
                        id={`field-${column.key}`}
                      />
                      <span className="font-medium text-foreground flex-1">
                        {column.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {column.key}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2 pt-3 border-t justify-between items-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handlePrint}
              disabled={isExporting || selectedKeys.size === 0}
              className="gap-1.5 font-medium"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button
              type="button"
              onClick={() => void handleExport()}
              disabled={isExporting || selectedKeys.size === 0}
              className="font-semibold shadow-xs gap-1.5"
            >
              {isExporting ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Exporting…
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export CSV ({selectedKeys.size})
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
