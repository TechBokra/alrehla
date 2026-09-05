"use client";

import * as React from "react";
import type {
  DataViewCapabilities,
  DataViewId,
  RegisteredDataView,
} from "./data-view-types";

export interface DataViewContextValue {
  views: Record<DataViewId, RegisteredDataView>;
  viewList: RegisteredDataView[];
  activeView: DataViewId;
  activeViewDefinition: RegisteredDataView | undefined;
  activeCapabilities: DataViewCapabilities;
  setActiveView: (id: DataViewId) => void;
}

export const DataViewContext = React.createContext<DataViewContextValue | null>(
  null
);

export function useDataView(): DataViewContextValue {
  const context = React.useContext(DataViewContext);
  if (!context) {
    throw new Error(
      "useDataView must be used within a <DataView> presentation provider."
    );
  }
  return context;
}

export function useOptionalDataView(): DataViewContextValue | null {
  return React.useContext(DataViewContext);
}
