"use client";

import * as React from "react";
import type { UniqueIdentifier } from "@dnd-kit/core";
import { cn } from "../../lib/utils";
import { ErrorState } from "../feedback/error-state";
import {
  ResourceErrorBanner,
  ResourceErrorState,
} from "../feedback/resource-error-state";
import { LoadingState } from "../feedback/loading-state";
import { SortableTree } from "../common/sortable-tree/sortable-tree";
import type { TreeItem as TreeItemType } from "../common/sortable-tree/types";
import { useResource } from "@eng-mohamedelsayed/admin-core/resource";
import { ResourceEmptyState } from "./resource-empty-state";

export interface ResourceHierarchyTreeProps<
  TData extends { id: UniqueIdentifier },
> {
  /** Explicit tree items, or defaults to the current resource dataView.data */
  items?: readonly TData[] | undefined;
  /** Name of the children property on each item. Defaults to "children" */
  childrenProp?: string | undefined;
  /** Pixel indentation width per depth level. Defaults to 40 */
  indentationWidth?: number | undefined;
  /** Whether branches can be expanded/collapsed. Defaults to true */
  collapsible?: boolean | undefined;
  /** Whether dragging is enabled overall or per-item */
  enableDrag?: boolean | ((item: TData) => boolean) | undefined;
  /** Callback fired when an item is moved/nested */
  onHierarchyChange?: (
    updatedItem: {
      id: UniqueIdentifier;
      parentId: UniqueIdentifier | null;
      index: number;
    },
    newItems: TData[]
  ) => void | Promise<void>;
  /** Custom renderer for the row value/content (name, badges, status, actions) */
  renderRow: (item: TData) => React.ReactNode;
  /** Custom icon renderer, or null to omit icon, or undefined for default folder/tag illustrations */
  renderIcon?: ((item: TData) => React.ReactNode | null) | undefined;
  /** Additional container classes */
  className?: string | undefined;
  /** Title for empty state */
  emptyTitle?: string | undefined;
  /** Description for empty state */
  emptyDescription?: string | undefined;
}

export function ResourceHierarchyTree<TData extends { id: UniqueIdentifier }>({
  items: propsItems,
  childrenProp = "children",
  indentationWidth = 40,
  collapsible = true,
  enableDrag,
  onHierarchyChange,
  renderRow,
  renderIcon,
  className,
  emptyTitle = "No items found",
  emptyDescription = "There are no hierarchical items to display.",
}: ResourceHierarchyTreeProps<TData>) {
  const resourceContext = useResource<TData>();
  if (resourceContext.dataView.loading) {
    return (
      <LoadingState
        label={`Loading ${resourceContext.definition.metadata.label.toLowerCase()}...`}
      />
    );
  }
  if (resourceContext.dataView.error) {
    return resourceContext.dataView.errorState ? (
      <ResourceErrorState
        state={resourceContext.dataView.errorState}
        onRetry={resourceContext.dataView.onRetry}
      />
    ) : (
      <ErrorState
        title={`Failed to load ${resourceContext.definition.metadata.label.toLowerCase()}`}
        description={resourceContext.dataView.error.message}
        {...(resourceContext.dataView.onRetry
          ? { onRetry: resourceContext.dataView.onRetry }
          : {})}
      />
    );
  }
  // SortableTree owns mutable drag state; make that local copy at the adapter
  // boundary while Resource Runtime remains readonly.
  const rawItems = [...(propsItems ?? resourceContext.dataView.data ?? [])];
  const resourceReorder = resourceContext.definition.dataView.reorder;
  const dragEnabled =
    enableDrag ?? (resourceReorder ? resourceReorder.enabled !== false : true);

  const handleHierarchyChange = React.useCallback(
    async (
      updatedItem: {
        id: UniqueIdentifier;
        parentId: UniqueIdentifier | null;
        index: number;
      },
      newItems: TData[]
    ) => {
      if (onHierarchyChange) {
        await onHierarchyChange(updatedItem, newItems);
        return;
      }
      if (resourceReorder?.enabled !== false && resourceReorder) {
        await resourceContext.actions.reorder(
          resourceReorder?.getPayload({
            updatedItem: {
              id: updatedItem.id,
              parentId: updatedItem.parentId,
              index: updatedItem.index,
            },
            rows: newItems,
          })
        );
      }
    },
    [onHierarchyChange, resourceContext.actions, resourceReorder]
  );

  const emptyStateNode =
    emptyTitle !== "No items found" ||
    emptyDescription !== "There are no hierarchical items to display." ? (
      <li className="flex flex-col items-center justify-center py-12 text-center list-none">
        <p className="text-sm font-medium text-foreground">{emptyTitle}</p>
        {emptyDescription && (
          <p className="text-xs text-muted-foreground mt-1">
            {emptyDescription}
          </p>
        )}
      </li>
    ) : (
      <li className="list-none">
        <ResourceEmptyState />
      </li>
    );

  return (
    <div className="space-y-4 w-full">
      {resourceContext.dataView.partialErrorState && (
        <ResourceErrorBanner
          state={resourceContext.dataView.partialErrorState}
          onRetry={resourceContext.dataView.onRetry}
        />
      )}
      <SortableTree<TData>
        items={rawItems}
        childrenProp={childrenProp}
        indentationWidth={indentationWidth}
        collapsible={collapsible}
        enableDrag={dragEnabled}
        onChange={handleHierarchyChange}
        renderValue={renderRow}
        renderIcon={renderIcon}
        className={className}
        emptyState={emptyStateNode}
      />
    </div>
  );
}
