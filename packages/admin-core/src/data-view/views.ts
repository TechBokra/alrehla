import type { DataViewViewId, DataViewViewsConfig } from './contracts';

export interface ResolvedDataViewViewsConfig {
  available: readonly DataViewViewId[];
  default: DataViewViewId;
  normalize(view: DataViewViewId | string | null | undefined): DataViewViewId;
  isConfigured(view: DataViewViewId | string | null | undefined): boolean;
}

export function resolveDataViewViewsConfig(
  config?: DataViewViewsConfig,
): ResolvedDataViewViewsConfig {
  const configured = config?.available?.length
    ? config.available
    : ['table' as DataViewViewId];
  const available = [...new Set(configured.filter(Boolean))];
  const safeAvailable = available.length ? available : ['table' as DataViewViewId];
  const requestedDefault = config?.default;
  const defaultView = requestedDefault && safeAvailable.includes(requestedDefault)
    ? requestedDefault
    : safeAvailable[0]!;

  return {
    available: safeAvailable,
    default: defaultView,
    normalize(view) {
      return view && safeAvailable.includes(view) ? view : defaultView;
    },
    isConfigured(view) {
      return Boolean(view && safeAvailable.includes(view));
    },
  };
}
