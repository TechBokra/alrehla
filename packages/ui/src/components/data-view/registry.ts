import type * as React from 'react';
import type { DataViewViewId } from '@alrehla/admin-core/data-view';
import type { ResourceDataViewAdapter } from '@alrehla/admin-core/resource';

export interface DataViewRendererCapabilities {
  pagination: boolean;
  columns: boolean;
  density: boolean;
  selection: boolean;
  sorting: boolean;
}

export interface DataViewRendererProps<TData = unknown> {
  dataView: ResourceDataViewAdapter<TData>;
  effectiveCapabilities: DataViewRendererCapabilities;
  renderRowActions?: (record: TData) => React.ReactNode;
  emptyState?: React.ReactNode;
}

export interface DataViewRendererDefinition {
  id: DataViewViewId;
  renderer: React.ComponentType<DataViewRendererProps<unknown>>;
  label: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  capabilities: DataViewRendererCapabilities;
}

export interface DataViewRegistry {
  get(id: DataViewViewId): DataViewRendererDefinition | undefined;
  entries(): readonly DataViewRendererDefinition[];
  extend(definitions: Record<string, DataViewRendererDefinition>): DataViewRegistry;
}

export function createDataViewRegistry(
  definitions: Record<string, DataViewRendererDefinition>,
): DataViewRegistry {
  const entries = Object.freeze(
    Object.values(definitions).map((definition) => Object.freeze({
      ...definition,
      capabilities: Object.freeze({ ...definition.capabilities }),
    })),
  );
  const byId = new Map(entries.map((definition) => [definition.id, definition]));
  return Object.freeze({
    get: (id: DataViewViewId) => byId.get(id),
    entries: () => entries,
    extend: (additional: Record<string, DataViewRendererDefinition>) =>
      createDataViewRegistry({
        ...Object.fromEntries(entries.map((definition) => [definition.id, definition])),
        ...additional,
      }),
  });
}
