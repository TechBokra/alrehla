'use client';

import * as React from 'react';
import type { Table as TanStackTable } from '@tanstack/react-table';
import { useDataViewUrlState } from '../data-view/url-state';
import type {
  DataTableBulkAction,
  DataTableReorderConfig,
  DataViewImportConfig,
  DataViewImportExecutionContext,
} from '../data-view/contracts';
import { useAdminNavigation } from '../navigation';
import { ResourceContext } from './context';
import {
  authorizationAllows,
  useResourceAuthorization,
} from './authorization';
import { createMissingResourceScopeError, resolveResourceError } from './errors';
import { useResourceExecutionContext } from './execution-context';
import { createResourceActions, useResourceMutations } from './mutations';
import { useResourceQuery } from './query';
import type {
  ResourceActions,
  ResourceContextValue,
  ResourceDataViewAdapter,
  ResourceDefinition,
  ResourceDensity,
  ResourceFormPresentation,
  ResourceFormState,
  ResourceListResult,
  ResourcePendingState,
  ResourceProviderProps,
  ResolvedResourceCapabilities,
} from './contracts';
import {
  resolveResourceBulkActions,
  resolveResourceCapabilities,
  resolveResourcePagination,
} from './contracts';

function resolvedFormMode(
  definition:
    | { mode?: ResourceFormPresentation; presentation?: ResourceFormPresentation }
    | undefined,
) {
  return definition?.mode ?? definition?.presentation ?? 'dialog';
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
  authorization: ReturnType<typeof useResourceAuthorization>,
): DataTableBulkAction<TData>[] {
  const resolved = resolveResourceBulkActions(
    definition,
    capabilities,
    {},
    authorization,
  );
  const standard: DataTableBulkAction<TData>[] = [];

  if (resolved.delete) {
    standard.push({
      id: 'delete',
      label: 'حذف المحدد',
      variant: 'destructive',
      confirmation: {
        resourceName: definition.metadata.pluralLabel ?? definition.metadata.label,
      },
      disabled: () => pending.delete || pending.deleteMany,
      executeIds: (ids, loadedRows) =>
        actions.deleteManyByIds
          ? actions.deleteManyByIds(ids, loadedRows)
          : actions.deleteMany(loadedRows),
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
  enabled: boolean,
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
  enabled: boolean,
): DataTableReorderConfig<TData> | undefined {
  const reorder = definition.dataView.reorder;
  if (!enabled || !reorder) return undefined;

  return {
    enabled: reorder.enabled !== false,
    onReorder: async (rows, context) => {
      const movedIndex = rows.findIndex(
        (row) => String(definition.dataView.getRowId(row)) === context.activeId,
      );
      const movedRow = movedIndex >= 0 ? rows[movedIndex] : undefined;
      await actions.reorder(
        reorder.getPayload({
          updatedItem: {
            id: context.activeId,
            parentId: movedRow ? (reorder.getParentId?.(movedRow) ?? null) : null,
            index: Math.max(0, movedIndex),
          },
          rows,
        }),
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
  defaultDensity = 'comfortable',
  notifier,
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
  const navigation = useAdminNavigation();
  const pagination = resolveResourcePagination(definition);
  const missingScopeError = definition.scope === 'scoped' && !execution?.scopeId
    ? createMissingResourceScopeError(definition.metadata.name)
    : null;
  const urlStateDefinition = definition.dataView.urlState;
  const urlState = useDataViewUrlState({
    ...(urlStateDefinition?.defaults ? { defaults: urlStateDefinition.defaults } : {}),
    ...(definition.dataView.filters ? { filters: definition.dataView.filters } : {}),
    allowedPageSizes: [...pagination.pageSizeOptions],
    ...(urlStateDefinition?.allowedSortIds
      ? { allowedSortIds: urlStateDefinition.allowedSortIds }
      : {}),
    ...(urlStateDefinition?.persistenceKey
      ? { persistenceKey: urlStateDefinition.persistenceKey }
      : {}),
    ...(definition.dataView.search?.debounceMs !== undefined
      ? { searchDebounceMs: definition.dataView.search.debounceMs }
      : {}),
    preserveSelectionAcrossPages:
      definition.dataView.selection?.preserveAcrossPages === true,
    selectionScopeKey: `${definition.metadata.name}:${definition.scope ?? 'global'}:${execution?.scopeId ?? ''}`,
  });
  const query = useResourceQuery(definition, initialData, urlState.state);
  const mutations = useResourceMutations(definition, notifier);
  const capabilities = resolveResourceCapabilities(definition, {}, authorization);
  const actions = React.useMemo(
    () => createResourceActions(definition, mutations),
    [definition, mutations],
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
    ],
  );
  const errors = React.useMemo(
    () => ({
      create: resolveResourceError(mutations.createMutation.error, 'create', {
        resourceLabel: definition.metadata.pluralLabel ?? definition.metadata.label,
        singularLabel: definition.metadata.singularLabel,
      }),
      update: resolveResourceError(mutations.updateMutation.error, 'update', {
        resourceLabel: definition.metadata.pluralLabel ?? definition.metadata.label,
        singularLabel: definition.metadata.singularLabel,
      }),
      delete: resolveResourceError(mutations.deleteMutation.error, 'delete', {
        resourceLabel: definition.metadata.pluralLabel ?? definition.metadata.label,
        singularLabel: definition.metadata.singularLabel,
      }),
      deleteMany: resolveResourceError(mutations.deleteManyMutation.error, 'bulk', {
        resourceLabel: definition.metadata.pluralLabel ?? definition.metadata.label,
        singularLabel: definition.metadata.singularLabel,
      }),
      reorder: resolveResourceError(mutations.reorderMutation.error, 'update', {
        resourceLabel: definition.metadata.pluralLabel ?? definition.metadata.label,
        singularLabel: definition.metadata.singularLabel,
      }),
      import: resolveResourceError(mutations.importMutation.error, 'bulk', {
        resourceLabel: definition.metadata.pluralLabel ?? definition.metadata.label,
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
    ],
  );
  const [formState, setFormState] = React.useState<ResourceFormState<TData>>({
    mode: 'closed',
  });
  const [deleteRecord, setDeleteRecord] = React.useState<TData | null>(null);
  const [previewRecord, setPreviewRecord] = React.useState<TData | null>(null);
  const [dataTable, setDataTableState] = React.useState<TanStackTable<TData> | null>(null);
  const [density, setDensity] = React.useState<ResourceDensity>(defaultDensity);

  const onRowClick = React.useCallback(
    (row: TData) => {
      const href = definition.dataView.getRowHref?.(row);
      if (href) navigation.push(href);
    },
    [definition.dataView, navigation],
  );
  const openForm = React.useCallback(
    (mode: 'create' | 'update', record?: TData) => {
      const formDefinition = definition.forms?.[mode];
      if (!formDefinition) return;
      if (resolvedFormMode(formDefinition) === 'page' && formDefinition.href) {
        navigation.push(formDefinition.href({ mode, ...(record ? { record } : {}) }));
        return;
      }
      setFormState(
        mode === 'update' && record ? { mode, record } : { mode: 'create' },
      );
    },
    [definition.forms, navigation],
  );
  const openCreate = React.useCallback(() => {
    if (capabilities.create) openForm('create');
  }, [capabilities.create, openForm]);
  const openUpdate = React.useCallback(
    (record: TData) => {
      if (capabilities.update) openForm('update', record);
    },
    [capabilities.update, openForm],
  );
  const closeForm = React.useCallback(() => setFormState({ mode: 'closed' }), []);
  const openDelete = React.useCallback(
    (record: TData) => {
      if (capabilities.delete) setDeleteRecord(record);
    },
    [capabilities.delete],
  );
  const closeDelete = React.useCallback(() => setDeleteRecord(null), []);
  const openPreview = React.useCallback((record: TData) => setPreviewRecord(record), []);
  const closePreview = React.useCallback(() => setPreviewRecord(null), []);
  const setDataTable = React.useCallback((table: TanStackTable<TData> | null) => {
    setDataTableState((current) => (current === table ? current : table));
  }, []);

  const selectedRowsById = React.useMemo(() => {
    const rows = query.data?.rows ?? [];
    const selectedIds = new Set(urlState.selection.executeIds);
    return rows.reduce<Record<string, TData>>((result, row) => {
      const id = definition.dataView.getRowId(row);
      if (selectedIds.has(id)) result[id] = row;
      return result;
    }, {});
  }, [definition.dataView, query.data?.rows, urlState.selection.executeIds]);
  const selectedRows = React.useMemo(
    () => Object.values(selectedRowsById),
    [selectedRowsById],
  );
  const bulkActions = React.useMemo(
    () => createBulkActions(definition, capabilities, actions, pending, authorization),
    [actions, authorization, capabilities, definition, pending],
  );
  const importConfig = React.useMemo(
    () => createImportConfig(definition, actions, capabilities.import),
    [actions, capabilities.import, definition],
  );
  const dataViewReorder = React.useMemo(
    () =>
      createDataViewReorder(
        definition,
        actions,
        authorizationAllows(definition.authorization?.update, authorization),
      ),
    [actions, authorization, definition],
  );
  const normalizedRows = query.data?.rows ?? [];
  const queryRows = definition.dataView.transformRows
    ? definition.dataView.transformRows(normalizedRows)
    : normalizedRows;
  const queryCount = query.data?.count ?? 0;
  const dataView = React.useMemo<ResourceDataViewAdapter<TData, TValue, TImport>>(
    () => ({
      data: queryRows,
      state: urlState.state,
      selectionState: urlState.selection,
      clearSelection: urlState.clearSelection,
      setSelectedIds: urlState.setSelectedIds,
      toggleSelection: urlState.toggleSelection,
      removeSelectedIds: urlState.removeSelectedIds,
      getRowId: definition.dataView.getRowId,
      rowCount: queryCount,
      pageCount: Math.ceil(queryCount / urlState.state.pagination.pageSize),
      loading: query.isLoading,
      isRefetching: query.isFetching && !query.isLoading,
      error: query.data === undefined ? (missingScopeError ?? query.error) : null,
      partialError: query.data !== undefined ? query.error : null,
      errorState:
        query.data === undefined
          ? resolveResourceError(
              missingScopeError ?? query.error,
              missingScopeError ? 'execution_context' : 'query',
              {
              resourceLabel: definition.metadata.pluralLabel ?? definition.metadata.label,
              singularLabel: definition.metadata.singularLabel,
              },
            )
          : null,
      partialErrorState:
        query.data !== undefined
          ? resolveResourceError(query.error, 'partial', {
              resourceLabel: definition.metadata.pluralLabel ?? definition.metadata.label,
              singularLabel: definition.metadata.singularLabel,
            })
          : null,
      onRetry: () => void query.refetch(),
      processingMode: definition.dataView.processingMode ?? 'server',
      pageSizeOptions: pagination.pageSizeOptions,
      search: definition.dataView.search,
      searchInput: urlState.searchInput,
      onSearchInputChange: urlState.setSearch,
      onSearchChange: urlState.commitSearch,
      filters: definition.dataView.filters ?? [],
      onFilterChange: urlState.setFilter,
      onFiltersReset: urlState.clearFilters,
      onPaginationChange: urlState.setPagination,
      onSortingChange: urlState.setSorting,
      onColumnVisibilityChange: urlState.setColumnVisibility,
      onColumnOrderChange: urlState.setColumnOrder,
      onRowSelectionChange: urlState.setRowSelection,
      onExpandedChange: urlState.setExpanded,
      ...(definition.emptyState?.title ? { emptyTitle: definition.emptyState.title } : {}),
      ...(definition.emptyState?.description
        ? { emptyDescription: definition.emptyState.description }
        : {}),
      checkbox: definition.dataView.checkbox,
      selection: definition.dataView.selection,
      hierarchy: definition.dataView.hierarchy,
      enableColumnOrdering: definition.dataView.enableColumnOrdering,
      selectedRows,
      bulkActions,
      ...(importConfig ? { importConfig } : {}),
      ...(definition.export ?? definition.dataView.exportConfig
        ? { exportConfig: definition.export ?? definition.dataView.exportConfig }
        : {}),
      ...(dataViewReorder ? { reorder: dataViewReorder } : {}),
      onTableReady: setDataTable,
      density,
      ...(definition.dataView.getRowHref ? { onRowClick } : {}),
    }),
    [
      bulkActions,
      dataViewReorder,
      definition.dataView,
      definition.export,
      definition.metadata.label,
      definition.metadata.pluralLabel,
      definition.metadata.singularLabel,
      density,
      importConfig,
      onRowClick,
      pagination.pageSizeOptions,
      query.data,
      query.error,
      missingScopeError,
      query.isFetching,
      query.isLoading,
      query.refetch,
      queryCount,
      queryRows,
      selectedRows,
      setDataTable,
      urlState,
    ],
  );
  const legacyDelete = definition.mutations?.delete;
  const mutationAdapters = React.useMemo(
    () => ({
      ...(legacyDelete
        ? {
            delete: {
              isPending: pending.delete,
              mutateAsync: (input: TDeleteInput) =>
                mutations.deleteMutation.mutateAsync(input),
              getInput: legacyDelete.getInput,
              ...(legacyDelete.getLabel ? { getLabel: legacyDelete.getLabel } : {}),
            },
          }
        : {}),
    }),
    [legacyDelete, mutations.deleteMutation, pending.delete],
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
      authorization,
      capabilities,
      dataView,
      mutations: mutationAdapters,
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
      authorization,
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
    ],
  );

  return (
    <ResourceContext.Provider
      value={value as unknown as ResourceContextValue<unknown>}
    >
      {children}
    </ResourceContext.Provider>
  );
}

export { useResourceMutations } from './mutations';
export { useResourceQuery } from './query';
