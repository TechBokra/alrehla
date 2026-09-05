"use client";

import * as React from "react";
import { Input } from "../ui/input";
import { DataViewExportMenu } from "../data-table/export-import/data-view-export-menu";
import { DataViewFilterControls } from "../data-table/filters/data-view-filters";
import { DataViewImportDialog } from "../data-table/export-import/data-view-import-dialog";
import { useResource } from "@eng-mohamedelsayed/admin-core/resource";

export {
  ResourceSearchBar,
  type ResourceSearchBarProps,
} from "./resource-search-bar";
import {
  ResourceSearchBar,
  type ResourceSearchBarProps,
} from "./resource-search-bar";

export interface ResourceSearchProps extends ResourceSearchBarProps {}

export function ResourceSearch(props: ResourceSearchProps) {
  return <ResourceSearchBar {...props} />;
}

export interface ResourceFiltersProps {
  className?: string | undefined;
  variant?: ("solid" | "default") | undefined;
  size?: ("sm" | "default" | "lg") | undefined;
  enableShortcut?: boolean | undefined;
  shortcutKey?: string | undefined;
  shortcutLabel?: string | undefined;
  trigger?: React.ReactNode | undefined;
}

export function ResourceFilters({
  className,
  variant,
  size,
  enableShortcut,
  shortcutKey,
  shortcutLabel,
  trigger,
}: ResourceFiltersProps = {}) {
  const { definition, dataView } = useResource();
  const filters = definition.dataView.filters ?? [];

  if (filters.length === 0 || !dataView.onFilterChange) return null;

  return (
    <DataViewFilterControls
      definitions={filters}
      values={dataView.state.filters}
      onChange={dataView.onFilterChange}
      onReset={() => dataView.onFiltersReset?.()}
      {...(className !== undefined ? { className } : {})}
      {...(variant !== undefined ? { variant } : {})}
      {...(size !== undefined ? { size } : {})}
      {...(enableShortcut !== undefined ? { enableShortcut } : {})}
      {...(shortcutKey !== undefined ? { shortcutKey } : {})}
      {...(shortcutLabel !== undefined ? { shortcutLabel } : {})}
      {...(trigger !== undefined ? { trigger } : {})}
    />
  );
}

export function ResourceImport() {
  const { capabilities, dataView } = useResource();

  if (!capabilities.import || !dataView.importConfig) return null;

  return <DataViewImportDialog config={dataView.importConfig} />;
}

export function ResourceExport() {
  const { definition, capabilities, dataView } = useResource();
  const exportConfig = definition.export ?? definition.dataView.exportConfig;
  const hierarchy = definition.dataView.hierarchy;

  if (!capabilities.export || !exportConfig) return null;

  return (
    <DataViewExportMenu
      config={exportConfig}
      data={dataView.data}
      state={dataView.state}
      selection={dataView.selectionState}
      getRowId={definition.dataView.getRowId}
      {...(hierarchy?.getSubRows ? { getSubRows: hierarchy.getSubRows } : {})}
    />
  );
}
