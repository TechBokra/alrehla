"use client";

import * as React from "react";
import { TableProperties } from "lucide-react";
import { DataView } from "../data-table/core/data-view";
import type { DataViewProps } from "../data-table/core/data-view";
import { DataTablePagination } from "../data-table/pagination/data-table-pagination";
import { createResourceRowActionsColumn } from "./resource-row-actions";
import {
  useResource,
  resolveResourcePagination,
  resolveResourceRowActions,
} from "@eng-mohamedelsayed/admin-core/resource";
import {
  authorizationAllows,
  resolveAuthorizedResourceViews,
  useResourceAuthorization,
} from "@eng-mohamedelsayed/admin-core/resource";
import { resolveResourceViews, getDataViewViewState } from "@eng-mohamedelsayed/admin-core/data-view";
import { createViewRegistry } from "../../data-view/registry";
import {
  useOptionalViewRegistry,
} from "../../data-view/runtime";
import type { ViewRendererProps } from "../../data-view/registry";
import {
  DataViewContext,
  type DataViewContextValue,
  useOptionalDataView,
} from "./data-view-context";
import type { RegisteredDataView } from "./data-view-types";
import { ResourceEmptyState } from "./resource-empty-state";
import { EmptyState } from "../feedback/empty-state";

export function ResourceTableView() {
  const {
    definition,
    dataView,
    capabilities,
    openDelete,
    openUpdate,
    setDataTable,
    density,
  } = useResource();
  const activeViewContext = useOptionalDataView();
  const authorization = useResourceAuthorization();
  const { dataView: dataViewDefinition, metadata } = definition;
  const resolvedRowActions = resolveResourceRowActions(
    definition,
    capabilities,
    authorization
  );
  const canUpdate = resolvedRowActions.edit;
  const canDelete = resolvedRowActions.delete;
  const customRowActions = resolvedRowActions.actions;
  const pagination = resolveResourcePagination(definition);
  const {
    bulkActions: adapterBulkActions,
    reorder: adapterReorder,
    ...dataViewWithoutTableOnlyOptionals
  } = dataView;
  const tableDataView = dataViewWithoutTableOnlyOptionals as unknown as DataViewProps<unknown, unknown>;

  const columns = React.useMemo(() => {
    const hasActions =
      canUpdate || canDelete || Boolean(customRowActions?.length);
    if (!hasActions) return dataViewDefinition.columns;

    return [
      ...dataViewDefinition.columns,
      createResourceRowActionsColumn({
        singularLabel: metadata.singularLabel,
        ...(canUpdate ? { onEdit: openUpdate } : {}),
        ...(canDelete ? { onDelete: openDelete } : {}),
        ...(customRowActions?.length ? { actions: customRowActions } : {}),
      }),
    ];
  }, [
    canDelete,
    canUpdate,
    dataViewDefinition.columns,
    customRowActions,
    metadata.singularLabel,
    openDelete,
    openUpdate,
  ]);

  return (
    <DataView
      {...tableDataView}
      columns={columns}
      getRowId={dataViewDefinition.getRowId}
      {...(dataViewDefinition.search
        ? { search: dataViewDefinition.search }
        : {})}
      {...(dataViewDefinition.filters
        ? { filters: dataViewDefinition.filters }
        : {})}
      checkbox={
        activeViewContext?.activeCapabilities.selection === false
          ? false
          : dataViewDefinition.checkbox ?? capabilities.selection
      }
      selection={{
        ...(dataViewDefinition.selection ?? {}),
        enabled:
          activeViewContext?.activeCapabilities.selection === false
            ? false
            : dataViewDefinition.selection?.enabled ?? capabilities.selection,
        ...(dataViewDefinition.selection?.mode
          ? { mode: dataViewDefinition.selection.mode }
          : { mode: "multiple" as const }),
      }}
      {...(capabilities.export &&
      (definition.export ?? dataViewDefinition.exportConfig)
        ? { exportConfig: definition.export ?? dataViewDefinition.exportConfig }
        : {})}
      {...(dataViewDefinition.hierarchy &&
      activeViewContext?.activeCapabilities.hierarchy !== false
        ? { hierarchy: dataViewDefinition.hierarchy }
        : {})}
      {...(dataViewDefinition.enableColumnOrdering !== undefined &&
      activeViewContext?.activeCapabilities.columnVisibility !== false
        ? { enableColumnOrdering: dataViewDefinition.enableColumnOrdering }
        : {})}
      pageSizeOptions={[...pagination.pageSizeOptions]}
      emptyState={<ResourceEmptyState />}
      {...(dataViewDefinition.processingMode
        ? { processingMode: dataViewDefinition.processingMode }
        : {})}
      density={density}
      hideToolbar
      hidePagination
      onTableReady={setDataTable}
      {...(activeViewContext?.activeCapabilities.bulkActions !== false &&
      adapterBulkActions
        ? { bulkActions: adapterBulkActions }
        : {})}
      {...(activeViewContext?.activeCapabilities.reordering !== false &&
      adapterReorder
        ? { reorder: adapterReorder }
        : {})}
      {...(dataView.onRowClick ? { onRowClick: dataView.onRowClick } : {})}
    />
  );
}

const BuiltInTableRenderer = (_props: ViewRendererProps) => (
  <ResourceTableView />
);

const builtInViewRegistry = createViewRegistry([
  {
    type: "table",
    label: "Table",
    icon: TableProperties,
    capabilities: {
      pagination: true,
      sorting: true,
      filtering: true,
      search: true,
      selection: true,
      bulkActions: true,
      reordering: true,
      columnVisibility: true,
    },
    renderer: BuiltInTableRenderer,
  },
]);

export { builtInViewRegistry };

function normalizeUiCapabilities(
  capabilities: import("@eng-mohamedelsayed/admin-core/data-view").DataViewCapabilities
) {
  return {
    ...capabilities,
    ...(capabilities.reordering !== undefined
      ? { reorder: capabilities.reordering }
      : {}),
  };
}

function useResourceViewRuntime() {
  const { definition, dataView } = useResource();
  const authorization = useResourceAuthorization();
  const providedRegistry = useOptionalViewRegistry();
  const registry = providedRegistry ?? builtInViewRegistry;
  const definitions = resolveResourceViews(definition.views);
  const authorizationResolution = resolveAuthorizedResourceViews(
    definition,
    dataView.state.activeView,
    authorization
  );
  const registeredViews = definitions.flatMap((view) => {
    if (!authorizationResolution.views.some((candidate) => candidate.id === view.id)) {
      return [];
    }
    const registration = registry.get(view.type);
    if (!registration) {
      return [];
    }
    return [{ view, registration }];
  });
  const activeView = dataView.view;
  const activeRegistration = activeView
    ? registry.get(activeView.type)
    : undefined;

  const viewList = React.useMemo<RegisteredDataView[]>(
    () =>
      registeredViews.map(({ view, registration }) => ({
        id: view.id,
        label: view.label ?? registration.label,
        ...(registration.icon ? { icon: registration.icon } : {}),
        capabilities: normalizeUiCapabilities({
          ...registration.capabilities,
          ...(view.capabilities ?? {}),
        }),
      })),
    [registeredViews]
  );
  const views = React.useMemo(
    () => Object.fromEntries(viewList.map((view) => [view.id, view])),
    [viewList]
  );
  const activeCapabilities = React.useMemo(
    () =>
      activeView && activeRegistration
        ? normalizeUiCapabilities({
            ...activeRegistration.capabilities,
            ...(activeView.capabilities ?? {}),
          })
        : {},
    [activeRegistration?.capabilities, activeView?.capabilities]
  );
  const contextValue = React.useMemo<DataViewContextValue>(
    () => ({
      views,
      viewList,
      activeView: activeView?.id ?? "",
      activeViewDefinition: activeView ? views[activeView.id] : undefined,
      activeCapabilities,
      setActiveView: dataView.setActiveView,
    }),
    [activeCapabilities, activeView, dataView.setActiveView, viewList, views]
  );

  return {
    contextValue,
    activeView,
    activeRegistration,
    registry,
    definitions,
  };
}

/** Provides the registry-backed active view context to toolbars and actions. */
export function ResourceViewRuntime({ children }: { children: React.ReactNode }) {
  const runtime = useResourceViewRuntime();
  return (
    <DataViewContext.Provider value={runtime.contextValue}>
      {children}
    </DataViewContext.Provider>
  );
}

/** Generic DataView Engine host. Rendering is selected by the runtime registry. */
export function ResourceDataView() {
  const { definition, dataView } = useResource();
  const runtime = useResourceViewRuntime();
  const activeView = runtime.activeView;
  const registration = runtime.activeRegistration;
  if (!activeView) {
    return (
      <EmptyState
        title="No authorized view available"
        description="You do not have access to an authorized presentation for this resource."
      />
    );
  }
  if (!registration) {
    return (
      <EmptyState
        title="View unavailable"
        description={`The ${activeView.type} view is not registered in this application.`}
      />
    );
  }
  const Renderer = registration.renderer;
  return (
    <DataViewContext.Provider value={runtime.contextValue}>
      <Renderer
        resource={definition}
        view={activeView}
        registration={registration}
        dataView={dataView}
        config={activeView.config ?? {}}
        state={getDataViewViewState(dataView.state, activeView.id)}
      />
    </DataViewContext.Provider>
  );
}

export function ResourcePagination() {
  const { definition, dataView, dataTable } = useResource();
  const view = useOptionalDataView();
  const pagination = resolveResourcePagination(definition);

  if (
    !pagination.enabled ||
    !dataTable ||
    (view && (!view.activeView || !view.activeViewDefinition)) ||
    view?.activeCapabilities.pagination === false
  )
    return null;

  return (
    <DataTablePagination
      table={dataTable}
      {...(dataView.rowCount !== undefined
        ? { rowCount: dataView.rowCount }
        : {})}
      pageSizeOptions={[...pagination.pageSizeOptions]}
    />
  );
}

export { ResourceTableView as LegacyResourceDataView };
