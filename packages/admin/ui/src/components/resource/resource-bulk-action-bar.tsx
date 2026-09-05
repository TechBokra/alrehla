"use client";

import * as React from "react";
import { CheckCircle2, ChevronDown, X } from "lucide-react";
import { AppError } from "@eng-mohamedelsayed/mutations/types";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { ResourceErrorBanner } from "../feedback/resource-error-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  authorizationAllows,
  useResource,
  useResourceAuthorization,
} from "@eng-mohamedelsayed/admin-core/resource";
import { useOptionalDataView } from "./data-view-context";
import {
  resolveResourceError,
  type ResourceErrorState,
} from "@eng-mohamedelsayed/admin-core/resource";
import {
  createResourceSelection,
  getDataViewTableState,
  resolveResourceSelectionExecution,
  type DataTableBulkAction,
} from "@eng-mohamedelsayed/admin-core/data-view";

export interface ResourceBulkActionBarProps<TData = unknown> {
  className?: string | undefined;
  actions?: DataTableBulkAction<TData>[] | undefined;
}

export function ResourceBulkActionBar<TData = unknown>({
  className,
  actions: customActions,
}: ResourceBulkActionBarProps<TData>) {
  const { definition, capabilities, dataView, dataTable, pending } =
    useResource<TData>();
  const authorization = useResourceAuthorization();
  const dataViewContext = useOptionalDataView();
  const [confirmationAction, setConfirmationAction] =
    React.useState<DataTableBulkAction<TData> | null>(null);
  const [partialError, setPartialError] =
    React.useState<ResourceErrorState | null>(null);
  const selection =
    dataView.selectionState ??
    createResourceSelection(getDataViewTableState(dataView.state).rowSelection);

  const selectedRows = React.useMemo(() => {
    if (selection.selectedIds.length === 0 || !dataView.data) return [];
    const selectedKeys = new Set(selection.selectedIds);
    const getRowId =
      definition.dataView.getRowId ??
      ((r: unknown) => (r as { id?: string }).id ?? "");
    return dataView.data.filter((row) => selectedKeys.has(getRowId(row)));
  }, [dataView.data, definition.dataView.getRowId, selection.selectedIds]);

  const selectedIds = selection.selectedIds;
  const executeIds = selection.executeIds;

  const selectedCount = selectedIds.length;

  // Respect capabilities
  const isSelectionSupported =
    (!dataViewContext ||
      Boolean(
        dataViewContext.activeView && dataViewContext.activeViewDefinition
      )) &&
    dataViewContext?.activeCapabilities.selection !== false &&
    dataViewContext?.activeCapabilities.bulkActions !== false &&
    capabilities.selection &&
    capabilities.bulkActions;

  const handleClearSelection = React.useCallback(() => {
    if (dataView.clearSelection) {
      dataView.clearSelection();
      return;
    }
    dataTable?.resetRowSelection();
  }, [dataTable, dataView]);

  const availableActions = React.useMemo<DataTableBulkAction<TData>[]>(() => {
    const actions = customActions ??
      dataView.bulkActions ?? [
        ...(definition.dataView.bulkActions ?? []),
        ...(definition.bulkActions?.actions ?? []),
      ];
    return actions.filter((action) =>
      authorizationAllows(action.permission, authorization)
    );
  }, [
    authorization,
    customActions,
    dataView.bulkActions,
    definition.bulkActions?.actions,
    definition.dataView.bulkActions,
  ]);

  const executeBulkAction = React.useCallback(
    async (act: DataTableBulkAction<TData>) => {
      if (act.disabled?.(selectedRows)) return;
      let result: unknown;
      if (act.executeIds) {
        result = await act.executeIds(executeIds, selectedRows);
      } else if (act.execute) {
        await act.execute(selectedRows);
      }
      const outcome = resolveResourceSelectionExecution(result, executeIds);
      if (outcome.failedIds.length > 0) {
        setPartialError(
          resolveResourceError(
            new AppError("Some selected items could not be processed.", {
              type: "unknown",
              details: outcome,
            }),
            "partial",
            {
              resourceLabel:
                definition.metadata.pluralLabel ?? definition.metadata.label,
              singularLabel: definition.metadata.singularLabel,
              partial: {
                succeededIds: outcome.successIds,
                failedIds: outcome.failedIds,
              },
            }
          )
        );
      } else {
        setPartialError(null);
      }
      if (dataView.removeSelectedIds) {
        dataView.removeSelectedIds(outcome.successIds);
      } else if (dataView.clearSelection) {
        if (outcome.failedIds.length === 0) dataView.clearSelection();
      } else if (dataView.onRowSelectionChange) {
        if (outcome.failedIds.length === 0) dataView.onRowSelectionChange({});
      } else {
        if (outcome.failedIds.length === 0) dataTable?.resetRowSelection();
      }
    },
    [dataTable, dataView, definition.metadata, executeIds, selectedRows]
  );

  const requestBulkAction = React.useCallback(
    (act: DataTableBulkAction<TData>) => {
      if (act.disabled?.(selectedRows)) return;
      if (act.confirmation) {
        setConfirmationAction(act);
        return;
      }
      void executeBulkAction(act).catch(() => undefined);
    },
    [executeBulkAction, selectedRows]
  );

  const confirmAction = React.useCallback(async () => {
    if (!confirmationAction) return;
    try {
      await executeBulkAction(confirmationAction);
      setConfirmationAction(null);
    } catch {
      // Mutation Core owns feedback. Keep the confirmation open so the user
      // can retry and selection remains intact after a failed mutation.
    }
  }, [confirmationAction, executeBulkAction]);

  const confirmationIsPending =
    confirmationAction?.id === "delete" &&
    (pending.delete || pending.deleteMany);
  const confirmationResourceName =
    confirmationAction?.confirmation?.resourceName ??
    definition.metadata.pluralLabel ??
    definition.metadata.label;
  const confirmationIsDelete = confirmationAction?.id === "delete";
  const confirmationTitle = confirmationAction
    ? (confirmationAction.confirmation?.title ??
      `${confirmationAction.label} ${selectedCount} ${
        selectedCount === 1
          ? definition.metadata.singularLabel.toLowerCase()
          : confirmationResourceName.toLowerCase()
      }?`)
    : "";
  const confirmationDescription = confirmationAction
    ? (confirmationAction.confirmation?.description ??
      (confirmationIsDelete
        ? `This action cannot be undone. The selected ${confirmationResourceName.toLowerCase()} will be permanently deleted.`
        : `This action will be applied to the selected ${confirmationResourceName.toLowerCase()}.`))
    : "";

  if (!isSelectionSupported || selectedCount === 0) {
    return null;
  }

  const primaryActions = availableActions.slice(0, 2);
  const secondaryActions = availableActions.slice(2);

  return (
    <>
      {partialError ? (
        <div className="fixed bottom-20 left-1/2 z-40 w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2">
          <ResourceErrorBanner
            state={partialError}
            onDismiss={() => setPartialError(null)}
          />
        </div>
      ) : null}
      <div
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-40",
          "animate-in fade-in slide-in-from-bottom-4 duration-200",
          "flex items-center gap-3 rounded-xl border border-border bg-card/95 px-4 py-2 text-sm shadow-2xl backdrop-blur-md",
          className
        )}
      >
        {/* Selected Count Indicator */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground pr-2 border-r border-border/70 select-none">
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
          <span>
            {selectedCount} {selectedCount === 1 ? "selected" : "selected"}
          </span>
        </div>

        {/* Primary Actions */}
        <div className="flex items-center gap-1.5">
          {primaryActions.map((act) => {
            const Icon = act.icon;
            const isDestructive = act.variant === "destructive";
            return (
              <Button
                key={act.id}
                variant={isDestructive ? "destructive" : "secondary"}
                size="sm"
                onClick={() => requestBulkAction(act)}
                disabled={act.disabled?.(selectedRows) ?? false}
                className="h-7 px-2.5 text-xs gap-1 font-medium shadow-2xs"
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                <span>{act.label}</span>
              </Button>
            );
          })}

          {/* Secondary Actions in More Dropdown */}
          {secondaryActions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1 font-medium shadow-2xs"
                >
                  <span>More</span>
                  <ChevronDown className="h-3 w-3 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                {secondaryActions.map((act) => {
                  const Icon = act.icon;
                  const isDestructive = act.variant === "destructive";
                  return (
                    <DropdownMenuItem
                      key={act.id}
                      disabled={act.disabled?.(selectedRows) ?? false}
                      onClick={() => requestBulkAction(act)}
                      className={cn(
                        "text-xs gap-1.5 cursor-pointer py-1.5",
                        isDestructive &&
                          "text-destructive focus:text-destructive"
                      )}
                    >
                      {Icon && <Icon className="h-3.5 w-3.5" />}
                      <span>{act.label}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Clear Selection Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClearSelection}
          disabled={availableActions.some((action) =>
            action.disabled?.(selectedRows)
          )}
          className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted ml-1"
          aria-label="Clear selection"
          title="Clear selection"
        >
          <X className="h-3.5 w-3.5" />
        </Button>

        <AlertDialog
          open={confirmationAction !== null}
          onOpenChange={(open) => {
            if (!open && !confirmationIsPending) setConfirmationAction(null);
          }}
        >
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmationTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmationDescription}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={confirmationIsPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(event) => {
                  event.preventDefault();
                  void confirmAction();
                }}
                disabled={confirmationIsPending}
                className={cn(
                  confirmationIsDelete &&
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                )}
              >
                {confirmationIsPending
                  ? confirmationIsDelete
                    ? "Deleting..."
                    : `${confirmationAction?.label ?? "Working"}...`
                  : (confirmationAction?.label ?? "Confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
