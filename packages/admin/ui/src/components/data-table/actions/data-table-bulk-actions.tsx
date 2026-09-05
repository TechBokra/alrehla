"use client";

import * as React from "react";
import type { Table } from "@tanstack/react-table";
import { Download, Printer, X } from "lucide-react";
import { Button } from "../../ui/button";
import { DeleteConfirmationDialog } from "../../feedback/delete-confirmation-dialog";
import { Separator } from "../../ui/separator";
import type {
  DataTableBulkAction,
  DataTableBulkActionExecute,
  DataViewExportConfig,
  ResourceSelection,
} from "@eng-mohamedelsayed/admin-core/data-view";
import {
  createResourceSelection,
  resolveResourceSelectionExecution,
} from "@eng-mohamedelsayed/admin-core/data-view";
import { DataViewBulkExportDialog } from "../export-import/data-view-bulk-export-dialog";

interface DataTableBulkActionsProps<TData> {
  table: Table<TData>;
  actions?: DataTableBulkAction<TData>[] | undefined;
  exportConfig?: DataViewExportConfig<TData> | undefined;
  /** Optional semantic selection; defaults to explicit table row state. */
  selection?: ResourceSelection | undefined;
  children?: React.ReactNode;
}

export function DataTableBulkActions<TData>({
  table,
  actions = [],
  exportConfig,
  selection: selectionState,
  children,
}: DataTableBulkActionsProps<TData>) {
  const selection =
    selectionState ?? createResourceSelection(table.getState().rowSelection);
  const selectedIds = selection.selectedIds;
  const executeIds = selection.executeIds;
  const selectedRows = table
    .getSelectedRowModel()
    .flatRows.map((row) => row.original);
  const selectedCount = selectedIds.length;
  const [pendingActionId, setPendingActionId] = React.useState<string | null>(
    null
  );
  const [confirmationAction, setConfirmationAction] =
    React.useState<DataTableBulkAction<TData> | null>(null);
  const [dialogAction, setDialogAction] =
    React.useState<DataTableBulkAction<TData> | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false);
  const [actionSnapshot, setActionSnapshot] = React.useState<{
    ids: string[];
    rows: TData[];
  }>({ ids: [], rows: [] });

  const effectiveExportConfig = React.useMemo<
    DataViewExportConfig<TData> | undefined
  >(() => {
    if (exportConfig) return exportConfig;

    const leafColumns = table
      .getAllLeafColumns()
      .filter(
        (col) =>
          col.id !== "select" &&
          col.id !== "actions" &&
          col.id !== "reorder" &&
          col.getIsVisible()
      );

    if (leafColumns.length === 0) return undefined;

    return {
      filename: `export-${new Date().toISOString().slice(0, 10)}.csv`,
      modes: ["selected"] as const,
      columns: leafColumns.map((col) => {
        const headerVal = col.columnDef.header;
        const label =
          typeof headerVal === "string"
            ? headerVal
            : col.id
                .replace(/_/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase());
        return {
          key: col.id,
          label,
          value: (row: any) => {
            const val = row[col.id];
            return val !== undefined ? val : "";
          },
        };
      }),
    };
  }, [exportConfig, table]);

  const runAction = React.useCallback(
    async (
      action: DataTableBulkAction<TData>,
      rows: TData[],
      ids: string[],
      override?: DataTableBulkActionExecute<TData>
    ) => {
      if (ids.length === 0) return;
      if (!override && !action.executeIds && !action.execute) return;

      setPendingActionId(action.id);
      try {
        let result: unknown;
        if (override) {
          await override(rows);
        } else if (action.executeIds) {
          result = await action.executeIds(ids, rows);
        } else {
          await action.execute?.(rows);
        }
        const outcome = resolveResourceSelectionExecution(result, ids);
        if (outcome.failedIds.length === 0) {
          table.resetRowSelection();
        } else {
          table.setRowSelection((current) =>
            Object.fromEntries(
              Object.entries(current).filter(
                ([id, selected]) =>
                  Boolean(selected) && outcome.failedIds.includes(id)
              )
            )
          );
        }
        setConfirmationAction(null);
        setDialogAction(null);
      } finally {
        setPendingActionId(null);
      }
    },
    [table]
  );

  const openAction = (action: DataTableBulkAction<TData>) => {
    if (action.disabled?.(selectedRows)) return;
    const snapshot = { ids: [...executeIds], rows: [...selectedRows] };
    if (action.confirmation) {
      setActionSnapshot(snapshot);
      setConfirmationAction(action);
      return;
    }
    if (action.renderDialog) {
      setActionSnapshot(snapshot);
      setDialogAction(action);
      return;
    }
    void runAction(action, snapshot.rows, snapshot.ids).catch(() => undefined);
  };

  const dialogContext = dialogAction
    ? {
        open: true,
        rows: actionSnapshot.rows,
        pending: pendingActionId === dialogAction.id,
        onOpenChange: (open: boolean) => {
          if (!open && pendingActionId !== dialogAction.id) {
            setDialogAction(null);
          }
        },
        execute: (override?: DataTableBulkActionExecute<TData>) =>
          runAction(
            dialogAction,
            actionSnapshot.rows,
            actionSnapshot.ids,
            override
          ),
      }
    : null;

  return (
    <>
      <div
        aria-live="polite"
        data-state={selectedCount > 0 ? "visible" : "hidden"}
        className={
          "fixed bottom-6 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-sm border bg-background/95 p-3 shadow-xl backdrop-blur transition-[opacity,transform] duration-200 ease-out supports-[backdrop-filter]:bg-background/80 " +
          (selectedCount > 0
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-3 scale-95 opacity-0")
        }
      >
        <span className="whitespace-nowrap px-2 text-xs font-semibold">
          {selectedCount} selected
        </span>
        {(actions.length > 0 || effectiveExportConfig || children) && (
          <Separator orientation="vertical" className="h-4" />
        )}
        <div className="flex items-center gap-2">
          {effectiveExportConfig ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={selectedCount === 0 || pendingActionId !== null}
                onClick={() => setExportDialogOpen(true)}
              >
                <Download data-icon="inline-start" />
                Export
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={selectedCount === 0 || pendingActionId !== null}
                onClick={() => setExportDialogOpen(true)}
              >
                <Printer data-icon="inline-start" />
                Print
              </Button>
            </>
          ) : null}
          {actions.map((action) => {
            const Icon = action.icon;
            const disabled =
              selectedCount === 0 ||
              pendingActionId !== null ||
              Boolean(action.disabled?.(selectedRows));
            return (
              <Button
                key={action.id}
                type="button"
                size="sm"
                variant={action.variant ?? "outline"}
                disabled={disabled}
                onClick={() => openAction(action)}
              >
                {Icon ? <Icon data-icon="inline-start" /> : null}
                {action.label}
              </Button>
            );
          })}
          {children}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-foreground"
          onClick={() => table.resetRowSelection()}
          aria-label="Clear selected rows"
        >
          <X aria-hidden="true" />
          <span className="sr-only">Deselect all</span>
        </Button>
      </div>

      {confirmationAction ? (
        <DeleteConfirmationDialog
          open
          onOpenChange={(open) => {
            if (!open && pendingActionId !== confirmationAction.id) {
              setConfirmationAction(null);
            }
          }}
          title={
            confirmationAction.confirmation?.title ??
            `Delete ${actionSnapshot.ids.length} ${confirmationAction.confirmation?.resourceName ?? "items"}?`
          }
          description={
            confirmationAction.confirmation?.description ??
            `You are about to delete ${actionSnapshot.ids.length} selected ${confirmationAction.confirmation?.resourceName ?? "items"}. This action may not be reversible.`
          }
          onConfirm={() => {
            void runAction(
              confirmationAction,
              actionSnapshot.rows,
              actionSnapshot.ids
            ).catch(() => undefined);
          }}
          loading={pendingActionId === confirmationAction.id}
        />
      ) : null}

      {dialogAction?.renderDialog && dialogContext
        ? dialogAction.renderDialog(dialogContext)
        : null}

      {effectiveExportConfig ? (
        <DataViewBulkExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          config={effectiveExportConfig}
          rows={selectedRows}
          selectedIds={selectedIds}
          executeIds={executeIds}
          selection={selection}
          onExportComplete={() => table.resetRowSelection()}
        />
      ) : null}
    </>
  );
}
