"use client";

import * as React from "react";
import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";

export interface DataTableDragHandleContextValue {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners | undefined;
  setActivatorNodeRef: (element: HTMLElement | null) => void;
  disabled: boolean;
}

export const DataTableDragHandleContext =
  React.createContext<DataTableDragHandleContextValue | null>(null);

export function DataTableDragHandle({
  label = "Reorder row",
}: {
  label?: string;
}) {
  const context = React.useContext(DataTableDragHandleContext);

  if (!context) return null;

  return (
    <Button
      ref={context.setActivatorNodeRef}
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={context.disabled}
      className={cn(
        "cursor-grab text-muted-foreground hover:text-foreground",
        "active:cursor-grabbing"
      )}
      aria-label={label}
      {...context.attributes}
      {...context.listeners}
      onClick={(event) => event.stopPropagation()}
    >
      <GripVertical aria-hidden="true" />
    </Button>
  );
}

export function getDataTableReorderColumn<
  TData,
  TValue = unknown,
>(): ColumnDefLike<TData, TValue> {
  return {
    id: "drag",
    header: () => <span className="sr-only">Reorder</span>,
    cell: () => <DataTableDragHandle />,
    enableSorting: false,
    enableHiding: false,
    size: 40,
  };
}

type ColumnDefLike<TData, TValue> = import("@tanstack/react-table").ColumnDef<
  TData,
  TValue
>;
