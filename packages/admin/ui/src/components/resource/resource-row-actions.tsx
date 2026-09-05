"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import type { ResourceIcon, ResourceRowAction } from "@eng-mohamedelsayed/admin-core/resource";

export interface ResourceRowActionsProps<TData> {
  record: TData;
  singularLabel: string;
  onEdit?: (record: TData) => void;
  onDelete?: (record: TData) => void;
  actions?: readonly ResourceRowAction<TData>[];
}

function ResourceMenuItem<TData>({
  record,
  action,
}: {
  record: TData;
  action: ResourceRowAction<TData>;
}) {
  const Icon = action.icon;
  return (
    <DropdownMenuItem
      className={action.destructive ? "text-destructive" : undefined}
      onClick={() => void action.onSelect(record)}
    >
      {Icon ? <Icon className="mr-2 h-4 w-4" aria-hidden="true" /> : null}
      {action.label}
    </DropdownMenuItem>
  );
}

export function ResourceRowActions<TData>({
  record,
  singularLabel,
  onEdit,
  onDelete,
  actions = [],
}: ResourceRowActionsProps<TData>) {
  if (!onEdit && !onDelete && actions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        {actions.map((action) => (
          <ResourceMenuItem key={action.id} record={record} action={action} />
        ))}
        {actions.length > 0 && (onEdit || onDelete) ? <DropdownMenuSeparator /> : null}
        {onEdit ? (
          <DropdownMenuItem onClick={() => onEdit(record)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit {singularLabel}
          </DropdownMenuItem>
        ) : null}
        {onEdit && onDelete ? <DropdownMenuSeparator /> : null}
        {onDelete ? (
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => onDelete(record)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete {singularLabel}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function createResourceRowActionsColumn<TData>({
  singularLabel,
  onEdit,
  onDelete,
  actions,
}: {
  singularLabel: string;
  onEdit?: (record: TData) => void;
  onDelete?: (record: TData) => void;
  actions?: readonly ResourceRowAction<TData>[];
}): ColumnDef<TData> {
  return {
    id: "resource-actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <ResourceRowActions
        record={row.original}
        singularLabel={singularLabel}
        {...(onEdit ? { onEdit } : {})}
        {...(onDelete ? { onDelete } : {})}
        {...(actions?.length ? { actions } : {})}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };
}

export type { ResourceIcon };
