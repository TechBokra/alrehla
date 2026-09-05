"use client";

import * as React from "react";
import { Edit2, MoreHorizontal, Trash2, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import { useResource } from "@eng-mohamedelsayed/admin-core/resource";

export interface ResourcePreviewProps<TData> {
  /** Custom render function receiving the currently previewed record */
  render?: (record: TData) => React.ReactNode;
  /** Children to render inside the preview sheet body */
  children?: React.ReactNode;
  className?: string | undefined;
}

export function ResourcePreview<TData = unknown>({
  render,
  children,
  className,
}: ResourcePreviewProps<TData>) {
  const { previewRecord, closePreview } = useResource<TData>();

  if (!previewRecord) return null;

  return (
    <Sheet open={Boolean(previewRecord)} onOpenChange={(open) => !open && closePreview()}>
      <SheetContent
        side="right"
        className={cn(
          "w-full sm:max-w-md md:max-w-lg p-0 gap-0 overflow-y-auto flex flex-col bg-background border-l border-border shadow-2xl",
          className
        )}
      >
        {render ? render(previewRecord) : children}
      </SheetContent>
    </Sheet>
  );
}

export interface ResourcePreviewTriggerProps<TData = unknown>
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  record: TData;
  children: React.ReactNode;
}

export function ResourcePreviewTrigger<TData = unknown>({
  record,
  children,
  className,
  onClick,
  ...props
}: ResourcePreviewTriggerProps<TData>) {
  const { openPreview } = useResource<TData>();

  return (
    <button
      type="button"
      {...props}
      onClick={(e) => {
        e.stopPropagation();
        openPreview(record);
        onClick?.(e);
      }}
      className={cn(
        "font-medium text-foreground hover:underline focus:outline-none text-left cursor-pointer",
        className
      )}
    >
      {children}
    </button>
  );
}

export interface ResourcePreviewHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode | undefined;
  thumbnail?: React.ReactNode | undefined;
  badge?: React.ReactNode | undefined;
  onEdit?: (() => void) | undefined;
  onDelete?: (() => void) | undefined;
  extraActions?: React.ReactNode | undefined;
  className?: string | undefined;
}

export function ResourcePreviewHeader({
  title,
  subtitle,
  thumbnail,
  badge,
  onEdit,
  onDelete,
  extraActions,
  className,
}: ResourcePreviewHeaderProps) {
  const { previewRecord, openUpdate, openDelete, closePreview } = useResource();

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else if (previewRecord && openUpdate) {
      openUpdate(previewRecord);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    } else if (previewRecord && openDelete) {
      openDelete(previewRecord);
    }
  };

  return (
    <div
      className={cn(
        "sticky top-0 z-10 flex flex-col gap-3 p-5 bg-background/95 backdrop-blur-sm border-b border-border/70",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {thumbnail && (
            <div className="h-12 w-12 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
              {thumbnail}
            </div>
          )}
          <div className="min-w-0 flex flex-col">
            <SheetTitle className="text-base font-semibold truncate leading-tight text-foreground">
              {title}
            </SheetTitle>
            {subtitle && (
              <span className="text-xs text-muted-foreground truncate mt-0.5">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            className="h-8 gap-1 px-2.5 text-xs font-medium"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit</span>
          </Button>

          {(onDelete || extraActions) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                {extraActions}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive cursor-pointer text-xs gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={closePreview}
            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {badge && <div className="flex items-center gap-2">{badge}</div>}
    </div>
  );
}

export interface ResourcePreviewSectionProps {
  title?: string | undefined;
  children: React.ReactNode;
  className?: string | undefined;
}

export function ResourcePreviewSection({
  title,
  children,
  className,
}: ResourcePreviewSectionProps) {
  return (
    <div className={cn("p-5 border-b border-border/40 last:border-b-0 space-y-3", className)}>
      {title && (
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h4>
      )}
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export interface ResourcePreviewFieldProps {
  label: string;
  value: React.ReactNode;
  className?: string | undefined;
}

export function ResourcePreviewField({
  label,
  value,
  className,
}: ResourcePreviewFieldProps) {
  if (value === undefined || value === null || value === "") return null;

  return (
    <div className={cn("flex items-center justify-between text-xs py-1 gap-2", className)}>
      <span className="text-muted-foreground shrink-0">{label}</span>
      <div className="text-foreground font-medium text-right truncate">{value}</div>
    </div>
  );
}
