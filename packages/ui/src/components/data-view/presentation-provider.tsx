'use client';

import * as React from 'react';
import { useResource, type ResourceControlCapabilities } from '@alrehla/admin-core/resource';
import {
  resolveDataViewViewsConfig,
  type DataViewViewId,
  type ResolvedDataViewViewsConfig,
} from '@alrehla/admin-core/data-view';
import { defaultDataViewRegistry } from './default-registry';
import type {
  DataViewRegistry,
  DataViewRendererCapabilities,
} from './registry';

const EMPTY_CAPABILITIES: DataViewRendererCapabilities = {
  pagination: false,
  columns: false,
  density: false,
  selection: false,
  sorting: false,
};

const intersectCapabilities = (
  resource: ResourceControlCapabilities,
  renderer: DataViewRendererCapabilities,
): DataViewRendererCapabilities => ({
  pagination: resource.pagination && renderer.pagination,
  columns: resource.columns && renderer.columns,
  density: resource.density && renderer.density,
  selection: resource.selection && renderer.selection,
  sorting: resource.sorting && renderer.sorting,
});

interface PresentationModel {
  activeView: DataViewViewId;
  configuredViews: readonly DataViewViewId[];
  usableViews: readonly DataViewViewId[];
  usableRenderers: readonly NonNullable<ReturnType<DataViewRegistry['get']>>[];
  renderer?: ReturnType<DataViewRegistry['get']>;
  rendererAvailable: boolean;
  rendererCapabilities: DataViewRendererCapabilities;
  effectiveCapabilities: DataViewRendererCapabilities;
}

export interface DataViewPresentationContextValue extends PresentationModel {
  onViewChange(view: DataViewViewId): void;
}

export const DataViewPresentationContext =
  React.createContext<DataViewPresentationContextValue | null>(null);

export function DataViewRegistryProvider({
  registry,
  children,
}: {
  registry: DataViewRegistry;
  children: React.ReactNode;
}) {
  return (
    <DataViewRegistryContext.Provider value={registry}>
      {children}
    </DataViewRegistryContext.Provider>
  );
}

const DataViewRegistryContext = React.createContext<DataViewRegistry>(defaultDataViewRegistry);

export function useDataViewRegistry() {
  return React.useContext(DataViewRegistryContext);
}

function resolvePresentation(
  resolvedViewsConfig: ResolvedDataViewViewsConfig,
  activeStateView: DataViewViewId | undefined,
  registry: DataViewRegistry,
  resourceControlCapabilities: ResourceControlCapabilities,
): PresentationModel {
  const activeView = resolvedViewsConfig.normalize(activeStateView);
  const usableRenderers = resolvedViewsConfig.available.flatMap((view) => {
    const renderer = registry.get(view);
    return renderer ? [renderer] : [];
  });
  const usableViews = usableRenderers.map((renderer) => renderer.id);
  const renderer = registry.get(activeView);
  const rendererCapabilities = renderer?.capabilities ?? EMPTY_CAPABILITIES;
  return {
    activeView,
    configuredViews: resolvedViewsConfig.available,
    usableViews,
    usableRenderers,
    ...(renderer ? { renderer } : {}),
    rendererAvailable: Boolean(renderer),
    rendererCapabilities,
    effectiveCapabilities: intersectCapabilities(
      resourceControlCapabilities,
      rendererCapabilities,
    ),
  };
}

export function DataViewPresentationProvider({ children }: { children: React.ReactNode }) {
  const { definition, dataView } = useResource();
  const registry = useDataViewRegistry();
  const resolvedViewsConfig = React.useMemo(
    () => resolveDataViewViewsConfig(definition.dataView.views),
    [definition.dataView.views],
  );
  const presentation = React.useMemo(
    () => resolvePresentation(
      resolvedViewsConfig,
      dataView.state.view,
      registry,
      dataView.controlCapabilities,
    ),
    [
      dataView.controlCapabilities,
      dataView.state.view,
      registry,
      resolvedViewsConfig,
    ],
  );
  const onViewChange = React.useCallback(
    (view: DataViewViewId) => dataView.onViewChange(view),
    [dataView.onViewChange],
  );
  const value = React.useMemo<DataViewPresentationContextValue>(
    () => ({ ...presentation, onViewChange }),
    [onViewChange, presentation],
  );

  return (
    <DataViewPresentationContext.Provider value={value}>
      {children}
    </DataViewPresentationContext.Provider>
  );
}

export function useDataViewPresentation() {
  const context = React.useContext(DataViewPresentationContext);
  if (!context) {
    throw new Error(
      'DataView presentation components must be rendered inside DataViewPresentationProvider.',
    );
  }
  return context;
}
