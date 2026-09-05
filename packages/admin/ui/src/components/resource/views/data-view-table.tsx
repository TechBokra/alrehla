"use client";

import * as React from "react";
import { DATA_VIEW_IDS, type DataViewCapabilities, type DataViewId } from "../data-view-types";
import { ResourceDataView } from "../resource-data-view";

export interface DataViewTableProps {
  id?: DataViewId | undefined;
  label?: string | undefined;
  icon?: React.ComponentType<{ className?: string }> | undefined;
  capabilities?: DataViewCapabilities | undefined;
}

export function DataViewTable({
  id = DATA_VIEW_IDS.table,
}: DataViewTableProps) {
  return <ResourceDataView />;
}
