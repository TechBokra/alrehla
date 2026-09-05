"use client";

import * as React from "react";
import type { DataViewCapabilities as CoreDataViewCapabilities } from "@eng-mohamedelsayed/admin-core/data-view";

export type DataViewId = string;

export const DATA_VIEW_IDS = {
  table: "table",
  tree: "tree",
  grid: "grid",
  calendar: "calendar",
  sections: "sections",
} as const;

/** Deprecated UI alias; new registrations use Core's serializable contract. */
export type DataViewCapabilities = CoreDataViewCapabilities & {
  /** @deprecated use `reordering`. */
  reorder?: boolean | undefined;
  /** @deprecated use `dateRange`. */
  dateNavigation?: boolean | undefined;
};

export interface RegisteredDataView {
  id: DataViewId;
  label: string;
  icon?: React.ComponentType<{ className?: string }> | undefined;
  capabilities: DataViewCapabilities;
}

export interface DataViewDescriptor {
  label: string;
  icon?: React.ComponentType<{ className?: string }> | undefined;
  capabilities?: DataViewCapabilities | undefined;
}

export type DataViewDescriptors = Record<DataViewId, DataViewDescriptor>;

export const DEFAULT_TABLE_CAPABILITIES: DataViewCapabilities = {
  pagination: true,
  sorting: true,
  filtering: true,
  search: true,
  selection: true,
  bulkActions: true,
  columnVisibility: true,
  reorder: true,
};

export const DEFAULT_TREE_CAPABILITIES: DataViewCapabilities = {
  hierarchy: true,
  reorder: true,
  filtering: true,
  search: true,
  pagination: false,
};

export const DEFAULT_GRID_CAPABILITIES: DataViewCapabilities = {
  pagination: true,
  sorting: true,
  filtering: true,
  search: true,
  selection: true,
  bulkActions: true,
};

export const DEFAULT_CALENDAR_CAPABILITIES: DataViewCapabilities = {
  dateNavigation: true,
  filtering: true,
  search: true,
  pagination: false,
};

export const DEFAULT_SECTIONS_CAPABILITIES: DataViewCapabilities = {
  reorder: true,
  filtering: true,
  search: true,
  selection: false,
  pagination: false,
};
