"use client";

import * as React from "react";
import { cn } from "../../../lib/utils";
import {
  DragHandleIcon,
  FolderIllustration,
  FolderOpenIllustration,
  TagIllustration,
} from "./tree-icons";
import type { HandleProps } from "./types";

export interface TreeItemProps
  extends Omit<React.HTMLAttributes<HTMLLIElement>, "id"> {
  childCount?: number;
  clone?: boolean;
  collapsed?: boolean;
  depth: number;
  disableInteraction?: boolean;
  disableSelection?: boolean;
  ghost?: boolean;
  handleProps?: HandleProps;
  indentationWidth: number;
  value: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode | null;
  hideHandle?: boolean;
  onCollapse?(): void;
  wrapperRef?(node: HTMLLIElement): void;
}

export const TreeItem = React.forwardRef<HTMLDivElement, TreeItemProps>(
  (
    {
      childCount,
      clone,
      depth,
      disableSelection,
      disableInteraction,
      ghost,
      handleProps,
      indentationWidth,
      collapsed,
      onCollapse,
      style,
      value,
      disabled,
      icon,
      hideHandle = false,
      wrapperRef,
      ...props
    },
    ref
  ) => {
    return (
      <li
        ref={wrapperRef}
        style={{ paddingLeft: `${indentationWidth * depth}px` }}
        className={cn("-mb-px list-none", {
          "pointer-events-none": disableInteraction,
          "select-none": disableSelection,
          "[&:first-of-type>div]:border-t-0": !clone,
        })}
        {...props}
      >
        <div
          ref={ref}
          style={style}
          className={cn(
            "bg-card transition-all relative flex items-center gap-x-3 border-y px-6 py-2.5 hover:bg-muted/30",
            {
              "border-l": depth > 0,
              "shadow-lg bg-card w-fit rounded-lg border-none pr-6 opacity-80":
                clone,
              "bg-muted/50 z-[1] opacity-50": ghost,
              "bg-muted/30 cursor-not-allowed": disabled,
            }
          )}
        >
          {!hideHandle && (
            <Handle {...handleProps} disabled={disabled ?? false} />
          )}
          <Collapse
            collapsed={collapsed ?? false}
            clone={clone ?? false}
            {...(onCollapse ? { onCollapse } : {})}
          />
          {icon !== undefined ? (
            icon
          ) : (
            <Icon
              childrenCount={childCount ?? 0}
              collapsed={collapsed ?? false}
              clone={clone ?? false}
            />
          )}
          <div className="flex-grow min-w-0 flex items-center text-sm">
            {value}
          </div>
          {childCount !== undefined && childCount > 0 && clone && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {childCount}
            </span>
          )}
        </div>
      </li>
    );
  }
);
TreeItem.displayName = "TreeItem";

/** Six-dot drag handle button */
function Handle({
  listeners,
  attributes,
  disabled,
}: HandleProps & { disabled?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md p-1",
        "text-muted-foreground transition-colors",
        "hover:bg-muted/60 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        disabled ? "cursor-not-allowed opacity-40" : "cursor-grab active:cursor-grabbing"
      )}
      disabled={disabled}
      {...attributes}
      {...listeners}
    >
      <DragHandleIcon />
    </button>
  );
}

/** Expand / collapse chevron button or 28px spacer */
function Collapse({
  collapsed,
  onCollapse,
  clone,
}: {
  collapsed?: boolean;
  onCollapse?: () => void;
  clone?: boolean;
}) {
  if (clone) {
    return <div className="size-7" role="presentation" />;
  }

  if (!onCollapse) {
    return <div className="size-7" role="presentation" />;
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onCollapse();
      }}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md p-1",
        "text-muted-foreground transition-colors",
        "hover:bg-muted/60 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="15"
        height="15"
        fill="none"
        className={cn("transition-transform", { "rotate-90": !collapsed })}
      >
        <path
          fill="currentColor"
          d="M5 4.91c0-.163.037-.323.108-.464a.85.85 0 0 1 .293-.334A.7.7 0 0 1 5.798 4a.7.7 0 0 1 .39.142l3.454 2.59c.11.082.2.195.263.33a1.04 1.04 0 0 1 0 .876.9.9 0 0 1-.263.33l-3.455 2.59a.7.7 0 0 1-.39.141.7.7 0 0 1-.396-.111.85.85 0 0 1-.293-.335c-.07-.14-.108-.3-.108-.464z"
        />
      </svg>
    </button>
  );
}

/** Illustrated folder or tag icon */
function Icon({
  childrenCount,
  collapsed,
  clone,
}: {
  childrenCount?: number;
  collapsed?: boolean;
  clone?: boolean;
}) {
  const isBranch = clone ? (childrenCount ?? 0) > 1 : !!childrenCount;
  const isOpen = clone ? false : !collapsed;

  return (
    <div className="flex size-7 items-center justify-center">
      {isBranch ? (
        isOpen ? (
          <FolderOpenIllustration />
        ) : (
          <FolderIllustration />
        )
      ) : (
        <TagIllustration />
      )}
    </div>
  );
}
