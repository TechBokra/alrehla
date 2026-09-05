"use client";

import * as React from "react";
import { useDataView } from "./data-view-context";
import type { DataViewId } from "./data-view-types";

export interface DataViewContentProps {
  className?: string | undefined;
  children: React.ReactNode;
}

/** @deprecated View selection is now performed by the DataView registry host. */
export function DataViewContent({
  className,
  children,
}: DataViewContentProps) {
  const { activeView } = useDataView();

  const childElements = React.useMemo(() => {
    return React.Children.toArray(children).filter(
      React.isValidElement
    ) as React.ReactElement<{ id?: DataViewId }>[];
  }, [children]);

  const activeElement = React.useMemo(() => {
    // 1. Find child with exact matching id prop
    const exactMatch = childElements.find(
      (child) => child.props.id === activeView
    );
    if (exactMatch) return exactMatch;

    // 2. Fallback to first child element
    return childElements[0] ?? null;
  }, [activeView, childElements]);

  if (!activeElement) {
    return null;
  }

  return (
    <div className={className} data-slot="data-view-content" data-active-view={activeView}>
      {activeElement}
    </div>
  );
}
