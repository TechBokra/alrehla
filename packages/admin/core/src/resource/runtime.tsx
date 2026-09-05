"use client";

import * as React from "react";
import type { Table as TanStackTable } from "@tanstack/react-table";
import { useDataViewUrlState } from "../data-view/url-state";
import { useResourceExecutionContext } from "./execution-context";
import type {
  DataTableBulkAction,
  DataTableReorderConfig,
  DataViewImportConfig,
  DataViewImportExecutionContext,
} from "../data-view/contracts";
import { ResourceContext } from "./context";
import type {
  ResourceActions,
  ResourceContextValue,
  ResourceDataViewAdapter,
  ResourceDefinition,
  ResourceFormPresentation,
  ResourceFormState,
  ResourcePendingState,
  ResourceProviderProps,
  ResourceListResult,
  ResourceDensity,
  ResolvedResourceCapabilities,
} from "./contracts";
import {
  resolveResourceBulkActions,
  resolveResourceCapabilities,
  resolveResourcePagination,
} from "./contracts";
import { getDataViewTableState } from "../data-view/state";
import {
  authorizationAllows,
  resolveAuthorizedResourceViews,
  useResourceAuthorization,
} from "./authorization";
import { createResourceActions, useResourceMutations } from "./mutations";
import { useResourceQuery } from "./query";
import { useAdminNavigation } from "../navigation";
import { resolveResourceError } from "./errors";

function resolvedFormMode(
  definition:
    | {
        mode?: ResourceFormPresentation;
        presentation?: ResourceFormPresentation;
      }
    | undefined
) {
  return definition?.mode ?? definition?.presentation ?? "dialog";
}

function createBulkActions<
  TData,
  TCreateInput,
  TUpdateInput,
  TQueryRaw,
  TValue,
  TImport,
  TDeleteInput,
>(
  definition: ResourceDefinition<
    TData,
    TCreateInput,
    TUpdateInput,
    TQueryRaw,
    TValue,
    TImport,
    TDeleteInput
  >,
  capabilities: ResolvedResourceCapabilities,
  actions: ResourceActions<TData, TCreateInput, TUpdateInput>,
  pending: ResourcePendingState,
  authorization?: import("./authorization").ResourceAuthorization
): DataTableBulkAction<TData>[] {
  const standard: DataTableBulkAction<TData>[] = [];
  const resolved = resolveResourceBulkActions(
    definition,
    capabilities,
    {},
    authorization
  );
  if (resolved.delete) {
    standard.push({
      id: "delete",
      label: "Delete",
      variant: "destructive",
      confirmation: {
        resourceName:
          definition.metadata.pluralLabel ?? definition.metadata.label,
      },
      disabled: () => pending.delete || pending.deleteMany,
      executeIds: async (ids, loadedRows) => {
        if (actions.deleteManyByIds) {
          return actions.deleteManyByIds(ids, loadedRows);
        }
        // Compatibility path for the current explicit page-local selection
        // model. Resources opting into cross-page selection should provide an
        // ID-native adapter through `deleteManyByIds`.
        return actions.deleteMany(loadedRows);
      },
    });
  }
  return [...standard, ...resolved.actions];
}

function createImportConfig<
  TData,
  TCreateInput,
  TUpdateInput,
  TQueryRaw,
  TValue,
  TImport,
  TDeleteInput,
>(
  definition: ResourceDefinition<
    TData,
    TCreateInput,
    TUpdateInput,
    TQueryRaw,
    TValue,
    TImport,
    TDeleteInput
  >,
  actions: ResourceActions<TData, TCreateInput, TUpdateInput>,
  enabled: boolean
): DataViewImportConfig<TImport> | undefined {
  const importDefinition = definition.import;
  if (!enabled || !importDefinition || importDefinition.enabled === false) {
    return undefined;
  }
  return {
    ...importDefinition.config,
    execute: async (context: DataViewImportExecutionContext<TImport>) => {
      const result = await actions.import(context.file);
      return importDefinition.result?.(result, context);
    },
  };
}

function createDataViewReorder<
  TData,
  TCreateInput,
  TUpdateInput,
  TQueryRaw,
  TValue,
  TImport,
  TDeleteInput,
>(
  definition: ResourceDefinition<
    TData,
    TCreateInput,
    TUpdateInput,
    TQueryRaw,
    TValue,
    TImport,
    TDeleteInput
  >,
  actions: ResourceActions<TData, TCreateInput, TUpdateInput>,
  enabled: boolean
): DataTableReorderConfig<TData> | undefined {
  const reorder = definition.dataView.reorder;
  if (!enabled || !reorder) return undefined;
  return {
    enabled: reorder.enabled !== false,
    onReorder: async (rows, context) => {
      const movedIndex = rows.findIndex(
        (row) => String(definition.dataView.getRowId(row)) === context.activeId
      );
      const movedRow = movedIndex >= 0 ? rows[movedIndex] : undefined;
      await actions.reorder(
        reorder.getPayload({
          updatedItem: {
            id: context.activeId,
            parentId: movedRow
              ? (reorder.getParentId?.(movedRow) ?? null)
              : null,
            index: Math.max(0, movedIndex),
          },
          rows,
        }) as never
      );
    },
  };
}

export function ResourceRuntimeProvider<
  TData,
  TCreateInput = unknown,
  TUpdateInput = unknown,
  TQueryRaw = ResourceListResult<TData>,
  TValue = unknown,
  TImport = Record<string, string>,
  TDeleteInput = string,
>({
  children,
  definition,
  initialData,
  defaultDensity = "compact",
}: ResourceProviderProps<
  TData,
  TCreateInput,
  TUpdateInput,
  TQueryRaw,
  TValue,
  TImport,
  TDeleteInput
>) {
  const execution = useResourceExecutionContext();
  const authorization = useResourceAuthorization();
  const urlState = definition.dataView.urlState;
  const pagination = resolveResourcePagination(definition);
  const viewResolution = resolveAuthorizedResourceViews(
    definition,
    undefined,
    authorization
  );
  const viewAuthorizationPending =
    !viewResolution.ready &&
    (!authorization || authorization.status === "loading");
  const viewAuthorization = React.useMemo(
    () => ({
      status: viewResolution.ready
        ? viewResolution.views.length > 0
          ? ("ready" as const)
          : ("unavailable" as const)
        : viewAuthorizationPending
          ? ("pending" as const)
          : ("unavailable" as const),
      allowedViewIds: viewResolution.views.map((view) => view.id),
    }),
    [viewAuthorizationPending, viewResolution.ready, viewResolution.views]
  );
  const {
    state: dataViewState,
    searchInput,
    setSearch,
    setFilter,
    clearFilters,
    setPagination,
    setSorting,
    setColumnVisibility,
    setColumnOrder,
    setRowSelection,
    selection,
    clearSelection,
    setSelectedIds,
    toggleSelection,
    removeSelectedIds,
    setExpanded,
    setActiveView,
    setViewState,
    patchViewState,
  } = useDataViewUrlState({
    ...(urlState?.defaults ? { defaults: urlState.defaults } : {}),
    ...(definition.dataView.filters
      ? { filters: definition.dataView.filters }
      : {}),
    allowedPageSizes: [...pagination.pageSizeOptions],
    ...(urlState?.allowedSortIds
      ? { allowedSortIds: urlState.allowedSortIds }
      : {}),
    ...(urlState?.persistenceKey
      ? { persistenceKey: urlState.persistenceKey }
      : {}),
    ...(definition.dataView.search
      ? { searchDebounceMs: definition.dataView.search.debounceMs }
      : {}),
    ...(definition.views ? { views: definition.views } : {}),
    viewAuthorization,
    preserveSelectionAcrossPages:
      definition.dataView.selection?.preserveAcrossPages === true,
    selectionScopeKey: `${definition.metadata.name}:${execution?.storeId ?? ""}`,
  });
  const activeResourceView = resolveAuthorizedResourceViews(
    definition,
    dataViewState.activeView,
    authorization
  ).view;
  const query = useResourceQuery(definition, initialData, dataViewState);
  const mutations = useResourceMutations(definition);
  const [formState, setFormState] = React.useState<ResourceFormState<TData>>({
    mode: "closed",
  });
  const [deleteRecord, setDeleteRecord] = React.useState<TData | null>(null);
  const [dataTable, setDataTableState] =
    React.useState<TanStackTable<TData> | null>(null);
  const [density, setDensity] = React.useState<ResourceDensity>(defaultDensity);
  const [previewRecord, setPreviewRecord] = React.useState<TData | null>(null);
  const navigation = useAdminNavigation();
  const capabilities = resolveResourceCapabilities(
    definition,
    {},
    authorization
  );
  const onRowClick = React.useCallback(
    (row: TData) => {
      const href = definition.dataView.getRowHref?.(row);
      if (href) navigation.push(href);
    },
    [definition.dataView, navigation]
  );
  const actions = React.useMemo(
    () => createResourceActions(definition, mutations),
    [definition, mutations]
  );
  const pending: ResourcePendingState = React.useMemo(
    () => ({
      create: mutations.createMutation.isPending,
      update: mutations.updateMutation.isPending,
      delete: mutations.deleteMutation.isPending,
      deleteMany: mutations.deleteManyMutation.isPending,
      reorder: mutations.reorderMutation.isPending,
      import: mutations.importMutation.isPending,
    }),
    [
      mutations.createMutation.isPending,
      mutations.deleteManyMutation.isPending,
      mutations.deleteMutation.isPending,
      mutations.importMutation.isPending,
      mutations.reorderMutation.isPending,
      mutations.updateMutation.isPending,
    ]
  );
  const errors = React.useMemo(
    () => ({
      create: resolveResourceError(mutations.createMutation.error, "create", {
        resourceLabel:
          definition.metadata.pluralLabel ?? definition.metadata.label,
        singularLabel: definition.metadata.singularLabel,
      }),
      update: resolveResourceError(mutations.updateMutation.error, "update", {
        resourceLabel:
          definition.metadata.pluralLabel ?? definition.metadata.label,
        singularLabel: definition.metadata.singularLabel,
      }),
      delete: resolveResourceError(mutations.deleteMutation.error, "delete", {
        resourceLabel:
          definition.metadata.pluralLabel ?? definition.metadata.label,
        singularLabel: definition.metadata.singularLabel,
      }),
      deleteMany: resolveResourceError(
        mutations.deleteManyMutation.error,
        "bulk",
        {
          resourceLabel:
            definition.metadata.pluralLabel ?? definition.metadata.label,
          singularLabel: definition.metadata.singularLabel,
        }
      ),
      reorder: resolveResourceError(mutations.reorderMutation.error, "update", {
        resourceLabel:
          definition.metadata.pluralLabel ?? definition.metadata.label,
        singularLabel: definition.metadata.singularLabel,
      }),
      import: resolveResourceError(mutations.importMutation.error, "bulk", {
        resourceLabel:
          definition.metadata.pluralLabel ?? definition.metadata.label,
        singularLabel: definition.metadata.singularLabel,
      }),
    }),
    [
      definition.metadata.label,
      definition.metadata.pluralLabel,
      definition.metadata.singularLabel,
      mutations.createMutation.error,
      mutations.deleteManyMutation.error,
      mutations.deleteMutation.error,
      mutations.importMutation.error,
      mutations.reorderMutation.error,
      mutations.updateMutation.error,
    ]
  );

  const openForm = React.useCallback(
    (mode: "create" | "update", record?: TData) => {
      const formDefinition = definition.forms?.[mode];
      if (!formDefinition) return;
      const presentation = resolvedFormMode(formDefinition);
      if (presentation === "page" && formDefinition.href) {
        navigation.push(
          formDefinition.href({
            mode,
            ...(record !== undefined ? { record } : {}),
          })
        );
        return;
      }
      setFormState(
        mode === "update" && record !== undefined
          ? { mode, record }
          : { mode: "create" }
      );
    },
    [definition.forms, navigation]
  );
  const openCreate = React.useCallback(() => {
    if (capabilities.create) openForm("create");
  }, [capabilities.create, openForm]);
  const openUpdate = React.useCallback(
    (record: TData) => {
      if (capabilities.update) openForm("update", record);
    },
    [capabilities.update, openForm]
  );
  const closeForm = React.useCallback(
    () => setFormState({ mode: "closed" }),
    []
  );
  const openDelete = React.useCallback(
    (record: TData) => {
      if (capabilities.delete) setDeleteRecord(record);
    },
    [capabilities.delete]
  );
  const closeDelete = React.useCallback(() => setDeleteRecord(null), []);
  const openPreview = React.useCallback(
    (record: TData) => setPreviewRecord(record),
    []
  );
  const closePreview = React.useCallback(() => setPreviewRecord(null), []);
  const setDataTable = React.useCallback(
    (table: TanStackTable<TData> | null) => {
      setDataTableState((current) => (current === table ? current : table));
    },
    []
  );

  const normalizedRows = query.data?.rows ?? [];
  const queryRows = definition.dataView.transformRows
    ? definition.dataView.transformRows(normalizedRows)
    : normalizedRows;
  const queryCount = query.data?.count ?? 0;
  const generatedBulkActions = React.useMemo(
    () =>
      createBulkActions(
        definition,
        capabilities,
        actions,
        pending,
        authorization
      ),
    [actions, authorization, capabilities, definition, pending, setRowSelection]
  );
  const importConfig = React.useMemo(
    () => createImportConfig(definition, actions, capabilities.import),
    [actions, capabilities.import, definition]
  );
  const dataViewReorder = React.useMemo(
    () =>
      createDataViewReorder(
        definition,
        actions,
        authorizationAllows(definition.authorization?.update, authorization)
      ),
    [actions, authorization, definition]
  );
  const dataView = React.useMemo<
    ResourceDataViewAdapter<TData, TValue, TImport>
  >(
    () => ({
      data: queryRows,
      state: dataViewState,
      view: activeResourceView,
      setActiveView,
      setViewState,
      patchViewState,
      selectionState: selection,
      clearSelection,
      setSelectedIds,
      toggleSelection,
      removeSelectedIds,
      rowCount: queryCount,
      pageCount: Math.ceil(
        queryCount / getDataViewTableState(dataViewState).pagination.pageSize
      ),
      loading: query.isLoading,
      isRefetching: query.isFetching && !query.isLoading,
      error: query.data === undefined ? query.error : null,
      partialError: query.data !== undefined ? query.error : null,
      errorState:
        query.data === undefined
          ? resolveResourceError(query.error, "query", {
              resourceLabel:
                definition.metadata.pluralLabel ?? definition.metadata.label,
              singularLabel: definition.metadata.singularLabel,
            })
          : null,
      partialErrorState:
        query.data !== undefined
          ? resolveResourceError(query.error, "partial", {
              resourceLabel:
                definition.metadata.pluralLabel ?? definition.metadata.label,
              singularLabel: definition.metadata.singularLabel,
            })
          : null,
      onRetry: () => {
        if (activeResourceView) void query.refetch();
      },
      searchInput,
      onSearchInputChange: setSearch,
      onFilterChange: setFilter,
      onFiltersReset: clearFilters,
      onPaginationChange: setPagination,
      onSortingChange: setSorting,
      onColumnVisibilityChange: setColumnVisibility,
      onColumnOrderChange: setColumnOrder,
      onRowSelectionChange: setRowSelection,
      onExpandedChange: setExpanded,
      bulkActions: generatedBulkActions,
      ...(importConfig ? { importConfig } : {}),
      ...(definition.export ? { exportConfig: definition.export } : {}),
      ...(dataViewReorder ? { reorder: dataViewReorder } : {}),
      ...(definition.dataView.getRowHref ? { onRowClick } : {}),
    }),
    [
      clearFilters,
      dataViewReorder,
      definition.dataView.getRowHref,
      definition.export,
      generatedBulkActions,
      importConfig,
      onRowClick,
      query.error,
      query.data,
      query.isFetching,
      query.isLoading,
      query.refetch,
      queryCount,
      queryRows,
      searchInput,
      setColumnOrder,
      setColumnVisibility,
      setExpanded,
      setActiveView,
      setViewState,
      patchViewState,
      setFilter,
      setPagination,
      setRowSelection,
      setSearch,
      setSorting,
      dataViewState,
      clearSelection,
      removeSelectedIds,
      selection,
      setSelectedIds,
      toggleSelection,
      activeResourceView,
    ]
  );

  const legacyDelete = definition.mutations?.delete;
  const mutationAdapters = React.useMemo(
    () =>
      legacyDelete
        ? {
            delete: {
              isPending: pending.delete,
              mutateAsync: (input: TDeleteInput) =>
                mutations.deleteMutation.mutateAsync(input),
              getInput: legacyDelete.getInput,
              ...(legacyDelete.getLabel
                ? { getLabel: legacyDelete.getLabel }
                : {}),
            },
          }
        : undefined,
    [legacyDelete, mutations.deleteMutation, pending.delete]
  );
  const value = React.useMemo<
    ResourceContextValue<
      TData,
      TCreateInput,
      TUpdateInput,
      TQueryRaw,
      TValue,
      TImport,
      TDeleteInput
    >
  >(
    () => ({
      definition,
      capabilities,
      dataView,
      ...(mutationAdapters ? { mutations: mutationAdapters } : {}),
      actions,
      pending,
      errors,
      formState,
      deleteRecord,
      dataTable,
      density,
      setDensity,
      previewRecord,
      openPreview,
      closePreview,
      openCreate,
      openUpdate,
      closeForm,
      openDelete,
      closeDelete,
      setDataTable,
    }),
    [
      actions,
      capabilities,
      closeDelete,
      closeForm,
      closePreview,
      dataTable,
      dataView,
      definition,
      deleteRecord,
      density,
      errors,
      formState,
      mutationAdapters,
      openCreate,
      openDelete,
      openPreview,
      openUpdate,
      pending,
      previewRecord,
      setDataTable,
    ]
  );

  return (
    <ResourceContext.Provider
      value={value as unknown as ResourceContextValue<unknown>}
    >
      {children}
    </ResourceContext.Provider>
  );
}

export { useResourceMutations } from "./mutations";
export { useResourceQuery } from "./query";
