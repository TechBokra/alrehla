"use client";

import * as React from "react";
import type { UniqueIdentifier } from "@dnd-kit/core";
import { DATA_VIEW_IDS, type DataViewCapabilities, type DataViewId } from "../data-view-types";
import {
  ResourceHierarchyTree,
  type ResourceHierarchyTreeProps,
} from "../resource-hierarchy-tree";

export interface DataViewTreeProps<TData extends { id: UniqueIdentifier }>
  extends ResourceHierarchyTreeProps<TData> {
  id?: DataViewId | undefined;
  label?: string | undefined;
  icon?: React.ComponentType<{ className?: string }> | undefined;
  capabilities?: DataViewCapabilities | undefined;
}

export function DataViewTree<TData extends { id: UniqueIdentifier }>({
  id = DATA_VIEW_IDS.tree,
  label,
  icon,
  capabilities,
  ...treeProps
}: DataViewTreeProps<TData>) {
  return <ResourceHierarchyTree<TData> {...treeProps} />;
}
