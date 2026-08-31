'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useDataViewUrlState } from '../data-view/url-state';
import type { DataViewBulkAction } from '../data-view/contracts';
import { ResourceContext } from './context';
import { createResourceActions, useResourceMutations } from './mutations';
import { useResourceQuery } from './query';
import type { ResourceDefinition, ResourceFormState, ResourcePendingState, ResourceProviderProps, ResourceDataViewAdapter } from './contracts';
import { resolveResourceBulkActions, resolveResourceCapabilities, resolveResourcePagination } from './contracts';

function useBulkActions<TData, TCreateValues, TUpdateValues, TQueryRaw>(definition: ResourceDefinition<TData, TCreateValues, TUpdateValues, TQueryRaw>, capabilities: ReturnType<typeof resolveResourceCapabilities<TData, TCreateValues, TUpdateValues, TQueryRaw>>, actions: ReturnType<typeof createResourceActions<TData, TCreateValues, TUpdateValues, TQueryRaw>>, pending: ResourcePendingState, clearSelection: () => void) {
  const resolved = resolveResourceBulkActions(definition, capabilities);
  return React.useMemo<DataViewBulkAction<TData>[]>(() => {
    const list: DataViewBulkAction<TData>[] = [...resolved.actions];
    if (resolved.delete) list.unshift({ id: 'delete', label: 'حذف المحدد', variant: 'destructive', disabled: () => pending.delete || pending.deleteMany, execute: async (rows) => { await actions.deleteMany(rows); clearSelection(); } });
    return list;
  }, [actions, clearSelection, pending.delete, pending.deleteMany, resolved.actions, resolved.delete]);
}

export function ResourceRuntimeProvider<TData, TCreateValues = never, TUpdateValues = never, TQueryRaw = import('./contracts').ResourceListResult<TData>>({ children, definition, notifier }: ResourceProviderProps<TData, TCreateValues, TUpdateValues, TQueryRaw>) {
  const pagination = resolveResourcePagination(definition);
  const urlState = useDataViewUrlState({
    ...(definition.dataView.urlState?.defaults ? { defaults: definition.dataView.urlState.defaults } : {}),
    ...(definition.dataView.filters ? { filters: definition.dataView.filters } : {}),
    allowedPageSizes: [...pagination.pageSizeOptions],
    ...(definition.dataView.urlState?.allowedSortIds ? { allowedSortIds: definition.dataView.urlState.allowedSortIds } : {}),
    ...(definition.dataView.urlState?.persistenceKey ? { persistenceKey: definition.dataView.urlState.persistenceKey } : {}),
    ...(definition.dataView.search?.debounceMs !== undefined ? { searchDebounceMs: definition.dataView.search.debounceMs } : {}),
  });
  const query = useResourceQuery(definition, urlState.state);
  const mutations = useResourceMutations(definition, notifier);
  const capabilities = resolveResourceCapabilities(definition);
  const actions = React.useMemo(() => createResourceActions(definition, mutations), [definition, mutations]);
  const [formState, setFormState] = React.useState<ResourceFormState<TData>>({ mode: 'closed' });
  const [deleteRecord, setDeleteRecord] = React.useState<TData | null>(null);
  const [previewRecord, setPreviewRecord] = React.useState<TData | null>(null);
  const [selectedRowsById, setSelectedRowsById] = React.useState<Record<string, TData>>({});
  const [dataTable, setDataTable] = React.useState<import('@tanstack/react-table').Table<TData> | null>(null);
  const [density, setDensity] = React.useState<import('./contracts').ResourceDensity>('comfortable');
  const router = useRouter();
  const pending: ResourcePendingState = { create: mutations.create.isPending, update: mutations.update.isPending, delete: mutations.delete.isPending, deleteMany: mutations.deleteMany.isPending };
  const openForm = React.useCallback((mode: 'create' | 'update', record?: TData) => {
    const form = definition.forms?.[mode];
    if (!form) return;
    if (form.mode === 'page' && form.href) { router.push(form.href({ mode, ...(record ? { record } : {}) })); return; }
    setFormState(mode === 'update' && record ? { mode, record } : { mode: 'create' });
  }, [definition.forms, router]);
  const clearSelection = React.useCallback(() => urlState.setRowSelection({}), [urlState.setRowSelection]);
  React.useEffect(() => {
    const visibleRows = query.data?.rows ?? [];
    setSelectedRowsById((current) => {
      const next = { ...current };
      let changed = false;
      visibleRows.forEach((row) => {
        const id = definition.dataView.getRowId(row);
        if (urlState.state.rowSelection[id]) {
          if (next[id] !== row) { next[id] = row; changed = true; }
        } else if (id in next) {
          delete next[id];
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, [definition.dataView.getRowId, query.data?.rows, urlState.state.rowSelection]);
  const selectedRows = React.useMemo(() => Object.values(selectedRowsById), [selectedRowsById]);
  const bulkActions = useBulkActions(definition, capabilities, actions, pending, clearSelection);
  const dataView = React.useMemo<ResourceDataViewAdapter<TData>>(() => ({ data: query.data?.rows ?? [], state: urlState.state, rowCount: query.data?.count ?? 0, pageCount: Math.ceil((query.data?.count ?? 0) / urlState.state.pagination.pageSize), loading: query.isLoading, isRefetching: query.isFetching && !query.isLoading, error: query.error, onRetry: () => void query.refetch(), searchInput: urlState.searchInput, onSearchInputChange: urlState.setSearch, onFilterChange: urlState.setFilter, onFiltersReset: urlState.clearFilters, onPaginationChange: urlState.setPagination, onSortingChange: urlState.setSorting, onColumnVisibilityChange: urlState.setColumnVisibility, onColumnOrderChange: urlState.setColumnOrder, onRowSelectionChange: urlState.setRowSelection, selectedRows, bulkActions }), [bulkActions, query.data, query.error, query.isFetching, query.isLoading, query.refetch, selectedRows, urlState]);
  const value = React.useMemo(() => ({ definition, capabilities, dataView, pending, actions, formState, deleteRecord, dataTable, density, setDensity, openCreate: () => openForm('create'), openUpdate: (record: TData) => openForm('update', record), closeForm: () => setFormState({ mode: 'closed' }), openDelete: (record: TData) => setDeleteRecord(record), closeDelete: () => setDeleteRecord(null), setDataTable, previewRecord, openPreview: (record: TData) => setPreviewRecord(record), closePreview: () => setPreviewRecord(null) }), [actions, capabilities, dataTable, dataView, deleteRecord, definition, density, formState, openForm, pending, previewRecord]);
  return <ResourceContext.Provider value={value as never}>{children}</ResourceContext.Provider>;
}
