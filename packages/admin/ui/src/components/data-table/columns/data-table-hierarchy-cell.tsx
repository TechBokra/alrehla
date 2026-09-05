"use client";

import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";
import {
  FolderIllustration,
  FolderOpenIllustration,
  TagIllustration,
} from "../../common/sortable-tree/tree-icons";

export interface DataTableHierarchyCellProps {
  depth?: number | undefined;
  title: React.ReactNode;
  subtitle?: React.ReactNode | undefined;
  icon?: React.ReactNode | undefined;
  image?: React.ReactNode | undefined;
  badge?: React.ReactNode | undefined;
  hasChildren?: boolean | undefined;
  isExpanded?: boolean | undefined;
  onToggleExpand?: (() => void) | undefined;
  indentRem?: number | undefined;
  className?: string | undefined;
}

export function DataTableHierarchyCell({
  depth = 0,
  title,
  subtitle,
  icon,
  image,
  badge,
  hasChildren = false,
  isExpanded = false,
  onToggleExpand,
  indentRem = 2.25,
  className,
}: DataTableHierarchyCellProps) {
  return (
    <div
      className={cn("flex items-center gap-2", className)}
      style={{
        paddingLeft: depth > 0 ? `${depth * indentRem}rem` : undefined,
      }}
    >
      {/* Expand / collapse trigger for parent nodes */}
      {hasChildren && onToggleExpand ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/60"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          aria-label={isExpanded ? "Collapse branch" : "Expand branch"}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-primary" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </Button>
      ) : hasChildren ? (
        <div className="w-6 shrink-0" />
      ) : null}

      {/* Thumbnail image, explicit icon, or illustrated folder/tag SVG */}
      {image ? (
        <div className="shrink-0">{image}</div>
      ) : icon ? (
        <div className="shrink-0 text-muted-foreground">{icon}</div>
      ) : hasChildren ? (
        <div className="flex size-[18px] shrink-0 items-center justify-center">
          {isExpanded ? <FolderOpenIllustration /> : <FolderIllustration />}
        </div>
      ) : (
        <div className="flex size-[18px] shrink-0 items-center justify-center">
          <TagIllustration />
        </div>
      )}

      {/* Title & Subtitle labels */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "truncate text-sm",
              depth === 0
                ? "font-semibold text-foreground"
                : "font-medium text-foreground/90"
            )}
          >
            {title}
          </span>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
        {subtitle && (
          <span className="truncate text-xs text-muted-foreground">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
