"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import {
  DATA_VIEW_IDS,
  type DataViewCapabilities,
  type DataViewDescriptors,
  type DataViewId,
  type RegisteredDataView,
} from "./data-view-types";
import { DataViewContext, type DataViewContextValue } from "./data-view-context";

export interface DataViewShellProps {
  /** Map or array of registered view descriptors */
  views?: DataViewDescriptors | RegisteredDataView[] | undefined;
  /** Default view ID if uncontrolled */
  defaultView?: DataViewId | undefined;
  /** Controlled active view ID */
  activeView?: DataViewId | undefined;
  /** Callback when active view changes */
  onActiveViewChange?: ((view: DataViewId) => void) | undefined;
  /** Container class name */
  className?: string | undefined;
  children: React.ReactNode;
}

/**
 * @deprecated Use ResourceDefinition.views with ResourceDataView and a
 * ViewRuntimeProvider. This bridge remains for external consumers while they
 * migrate from child-selected presentations.
 */
export function ResourceViews({
  views: rawViews,
  defaultView = DATA_VIEW_IDS.table,
  activeView: controlledActiveView,
  onActiveViewChange,
  className,
  children,
}: DataViewShellProps) {
  // Normalize views into map and list
  const { views, viewList } = React.useMemo(() => {
    const viewMap: Record<DataViewId, RegisteredDataView> = {};
    const list: RegisteredDataView[] = [];

    if (Array.isArray(rawViews)) {
      for (const view of rawViews) {
        const fullView: RegisteredDataView = {
          ...view,
          capabilities: view.capabilities ?? {},
        };
        viewMap[view.id] = fullView;
        list.push(fullView);
      }
    } else if (rawViews && typeof rawViews === "object") {
      for (const [id, desc] of Object.entries(rawViews)) {
        const fullView: RegisteredDataView = {
          id,
          label: desc.label,
          icon: desc.icon,
          capabilities: desc.capabilities ?? {},
        };
        viewMap[id] = fullView;
        list.push(fullView);
      }
    }

    return { views: viewMap, viewList: list };
  }, [rawViews]);

  // Uncontrolled state fallback
  const [internalActiveView, setInternalActiveView] = React.useState<DataViewId>(
    () => controlledActiveView ?? defaultView ?? viewList[0]?.id ?? DATA_VIEW_IDS.table
  );

  const rawActive = controlledActiveView ?? internalActiveView;

  // Safe fallback resolution
  const resolvedActiveView = React.useMemo<DataViewId>(() => {
    if (viewList.length === 0) return rawActive;
    if (views[rawActive]) return rawActive;
    if (defaultView && views[defaultView]) return defaultView;
    if (viewList[0]) return viewList[0].id;
    return DATA_VIEW_IDS.table;
  }, [defaultView, rawActive, viewList, views]);

  const setActiveView = React.useCallback(
    (id: DataViewId) => {
      if (onActiveViewChange) {
        onActiveViewChange(id);
      } else {
        setInternalActiveView(id);
      }
    },
    [onActiveViewChange]
  );

  const activeViewDefinition = views[resolvedActiveView];
  const activeCapabilities = React.useMemo<DataViewCapabilities>(() => {
    return activeViewDefinition?.capabilities ?? {};
  }, [activeViewDefinition, resolvedActiveView]);

  const contextValue = React.useMemo<DataViewContextValue>(
    () => ({
      views,
      viewList,
      activeView: resolvedActiveView,
      activeViewDefinition,
      activeCapabilities,
      setActiveView,
    }),
    [
      views,
      viewList,
      resolvedActiveView,
      activeViewDefinition,
      activeCapabilities,
      setActiveView,
    ]
  );

  return (
    <DataViewContext.Provider value={contextValue}>
      <div className={cn("space-y-4", className)}>{children}</div>
    </DataViewContext.Provider>
  );
}
