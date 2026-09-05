"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Row } from "@tanstack/react-table";
import { cn } from "../../../lib/utils";
import { TableRow } from "../../ui/table";
import { DataTableDragHandleContext } from "../columns/data-table-drag-handle";

interface DataTableSortableRowProps<TData> {
  row: Row<TData>;
  children: React.ReactNode;
  disabled?: boolean;
  onRowClick?: ((row: TData) => void) | undefined;
  isDropTarget?: boolean;
  dropPosition?: "before" | "after" | "inside" | null;
  isDropForbidden?: boolean;
  indentSize?: number | undefined;
}

export function DataTableSortableRow<TData>({
  row,
  children,
  disabled = false,
  onRowClick,
  isDropTarget = false,
  dropPosition = null,
  isDropForbidden = false,
  indentSize = 24,
}: DataTableSortableRowProps<TData>) {
  const sortable = useSortable({ id: row.id, disabled });

  const isNestingTarget = isDropTarget && dropPosition === "inside";
  const isBeforeTarget = isDropTarget && dropPosition === "before";
  const isAfterTarget = isDropTarget && dropPosition === "after";
  const depth = row.depth ?? 0;
  const indentPx = depth * indentSize;

  return (
    <DataTableDragHandleContext.Provider
      value={{
        attributes: sortable.attributes,
        listeners: sortable.listeners,
        setActivatorNodeRef: sortable.setActivatorNodeRef,
        disabled,
      }}
    >
      <TableRow
        ref={sortable.setNodeRef}
        style={
          {
            transform: CSS.Transform.toString(sortable.transform),
            transition: sortable.transition,
            ...(indentPx > 0
              ? {
                  "--row-indent": `${indentPx}px`,
                }
              : {}),
          } as React.CSSProperties
        }
        data-state={row.getIsSelected() && "selected"}
        data-depth={row.depth}
        data-dragging={sortable.isDragging ? "true" : undefined}
        data-drag-disabled={disabled ? "true" : undefined}
        data-drop-target={isDropTarget ? "true" : undefined}
        data-drop-position={dropPosition ?? undefined}
        onClick={(event) => {
          const target = event.target;
          if (
            target instanceof Element &&
            target.closest(
              "button,a,input,select,textarea,[role='button'],[role='menuitem'],[data-datatable-interactive]"
            )
          ) {
            return;
          }
          onRowClick?.(row.original);
        }}
        className={cn(
          "transition-colors relative",
          onRowClick && "cursor-pointer",
          indentPx > 0
            ? "bg-[linear-gradient(to_right,transparent_var(--row-indent),hsl(var(--card))_var(--row-indent))] hover:bg-[linear-gradient(to_right,transparent_var(--row-indent),hsl(var(--muted)/0.5)_var(--row-indent))] data-[state=selected]:bg-[linear-gradient(to_right,transparent_var(--row-indent),hsl(var(--muted)/0.8)_var(--row-indent))] after:absolute after:bottom-0 after:right-0 after:h-px after:bg-border/60 after:left-[var(--row-indent)]"
            : "bg-card hover:bg-muted/50 data-[state=selected]:bg-muted border-b border-border/40",
          sortable.isDragging && "relative z-20 opacity-40 bg-muted/90 shadow-lg",
          isNestingTarget &&
            !isDropForbidden &&
            "relative z-10 border-2 border-primary bg-primary/15 ring-2 ring-primary/50 ring-inset shadow-xs",
          isNestingTarget &&
            isDropForbidden &&
            "relative z-10 border-2 border-destructive bg-destructive/10 ring-2 ring-destructive/50 ring-inset",
          isBeforeTarget &&
            "before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-primary before:z-30",
          isAfterTarget &&
            "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:z-30"
        )}
      >
        {children}
      </TableRow>
    </DataTableDragHandleContext.Provider>
  );
}
