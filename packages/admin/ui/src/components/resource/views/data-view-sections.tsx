"use client";

import * as React from "react";
import { DATA_VIEW_IDS, type DataViewCapabilities, type DataViewId } from "../data-view-types";
import { cn } from "../../../lib/utils";

export interface DataViewSectionsProps<TData extends { id: string }> {
  id?: DataViewId | undefined;
  label?: string | undefined;
  icon?: React.ComponentType<{ className?: string }> | undefined;
  capabilities?: DataViewCapabilities | undefined;
  items?: TData[] | undefined;
  renderItem?: ((item: TData, index: number) => React.ReactNode) | undefined;
  onReorder?: ((items: TData[]) => void) | undefined;
  emptyState?: React.ReactNode | undefined;
  className?: string | undefined;
}

export function DataViewSections<TData extends { id: string }>({
  id = DATA_VIEW_IDS.sections,
  items = [],
  renderItem,
  emptyState,
  className,
}: DataViewSectionsProps<TData>) {
  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item, index) =>
        renderItem ? renderItem(item, index) : null
      )}
    </div>
  );
}
