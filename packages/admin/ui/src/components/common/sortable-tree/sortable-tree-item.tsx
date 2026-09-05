"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { UniqueIdentifier } from "@dnd-kit/core";
import { TreeItem, type TreeItemProps } from "./tree-item";

interface SortableTreeItemProps
  extends Omit<TreeItemProps, "ref" | "wrapperRef" | "handleProps"> {
  id: UniqueIdentifier;
}

export function SortableTreeItem({ id, depth, ...props }: SortableTreeItemProps) {
  const {
    attributes,
    isDragging,
    isSorting,
    listeners,
    setDraggableNodeRef,
    setDroppableNodeRef,
    transform,
    transition,
  } = useSortable({
    id,
    animateLayoutChanges: ({ isSorting, wasDragging }) =>
      !(isSorting || wasDragging),
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <TreeItem
      ref={setDraggableNodeRef}
      wrapperRef={setDroppableNodeRef}
      style={style}
      depth={depth}
      ghost={isDragging}
      disableSelection={isSorting}
      disableInteraction={isSorting}
      handleProps={{ attributes, listeners }}
      {...props}
    />
  );
}
