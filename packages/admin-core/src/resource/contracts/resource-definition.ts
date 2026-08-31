import type * as React from 'react';
import type { ColumnDef, SortingState, VisibilityState, ColumnOrderState } from '@tanstack/react-table';
import type { DataViewBulkAction, DataViewFilterDefinition, DataViewSearchConfig, DataViewExportConfig, DataViewState } from '../../data-view/contracts';
import type { ResourceCapabilities, ResourceMetadata } from './resource-state';
import type { ResourceFormsDefinition } from './resource-form';
import type { ResourceMutationsDefinition } from './resource-mutation';
import type { ResourceListResult, ResourceQueryDefinition } from './resource-query';

export interface ResourceDataViewDefinition<TData> {
  columns: ColumnDef<TData, unknown>[];
  getRowId: (row: TData) => string;
  search?: DataViewSearchConfig;
  filters?: readonly DataViewFilterDefinition[];
  selection?: { enabled?: boolean; mode?: 'single' | 'multiple'; preserveAcrossPages?: boolean };
  enableColumnOrdering?: boolean;
  processingMode?: 'server' | 'client';
  pageSizeOptions?: readonly number[];
  rowActions?: readonly ResourceRowAction<TData>[];
  urlState?: { defaults?: { page?: number; pageSize?: number; sorting?: SortingState; filters?: DataViewState['filters']; columnVisibility?: VisibilityState; columnOrder?: ColumnOrderState }; allowedSortIds?: readonly string[]; persistenceKey?: string };
}

export interface ResourceRowAction<TData> { id: string; label: string; icon?: React.ElementType<{ className?: string }>; destructive?: boolean; onSelect: (record: TData) => void | Promise<void> }

export interface ResourceDefinition<TData, TCreateValues = never, TUpdateValues = never, TQueryRaw = ResourceListResult<TData>> {
  metadata: ResourceMetadata;
  capabilities?: ResourceCapabilities;
  query?: ResourceQueryDefinition<TData, TQueryRaw>;
  mutations?: ResourceMutationsDefinition<TData, TCreateValues, TUpdateValues>;
  dataView: ResourceDataViewDefinition<TData>;
  forms?: ResourceFormsDefinition<TData, TCreateValues, TUpdateValues>;
  rowActions?: { edit?: boolean; delete?: boolean; actions?: readonly ResourceRowAction<TData>[] };
  bulkActions?: { delete?: boolean; actions?: readonly DataViewBulkAction<TData>[] };
  bulkDelete?: { strategy: 'individual' };
  export?: DataViewExportConfig<TData>;
  emptyState?: { title?: string; description?: string };
}

export function defineResource<TData, TCreateValues = never, TUpdateValues = never, TQueryRaw = ResourceListResult<TData>>(definition: ResourceDefinition<TData, TCreateValues, TUpdateValues, TQueryRaw>) { return definition; }

export function resolveResourceCapabilities<TData, TCreateValues, TUpdateValues, TQueryRaw>(definition: ResourceDefinition<TData, TCreateValues, TUpdateValues, TQueryRaw>): Required<ResourceCapabilities> {
  const configured = definition.capabilities ?? {};
  return {
    create: configured.create ?? Boolean(definition.forms?.create && definition.mutations?.create),
    update: configured.update ?? Boolean(definition.forms?.update && definition.mutations?.update),
    delete: configured.delete ?? Boolean(definition.mutations?.delete),
    selection: configured.selection ?? Boolean(definition.mutations?.deleteMany || definition.bulkDelete),
    bulkActions: configured.bulkActions ?? Boolean(definition.mutations?.deleteMany || definition.bulkDelete || definition.bulkActions?.actions?.length),
    export: configured.export ?? Boolean(definition.export),
  };
}

export function resolveResourcePagination<TData, TCreateValues, TUpdateValues, TQueryRaw>(definition: ResourceDefinition<TData, TCreateValues, TUpdateValues, TQueryRaw>) { return { enabled: true, pageSizeOptions: definition.dataView.pageSizeOptions ?? [5, 10, 20, 50, 100] }; }

export function resolveResourceRowActions<TData, TCreateValues, TUpdateValues, TQueryRaw>(definition: ResourceDefinition<TData, TCreateValues, TUpdateValues, TQueryRaw>, capabilities: Required<ResourceCapabilities>) { return { edit: capabilities.update && (definition.rowActions?.edit ?? true), delete: capabilities.delete && Boolean(definition.mutations?.delete) && (definition.rowActions?.delete ?? true), actions: [...(definition.dataView.rowActions ?? []), ...(definition.rowActions?.actions ?? [])] }; }

export function resolveResourceBulkActions<TData, TCreateValues, TUpdateValues, TQueryRaw>(definition: ResourceDefinition<TData, TCreateValues, TUpdateValues, TQueryRaw>, capabilities: Required<ResourceCapabilities>) { return { delete: capabilities.bulkActions && (definition.bulkActions?.delete ?? true) && Boolean(definition.mutations?.deleteMany || definition.bulkDelete), actions: [...(definition.bulkActions?.actions ?? [])] }; }
