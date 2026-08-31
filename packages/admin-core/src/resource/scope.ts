export type ResourceScope = 'scoped' | 'global';

/** Existing Alrehla resources are global unless they explicitly opt into scope isolation. */
export const DEFAULT_RESOURCE_SCOPE: ResourceScope = 'global';

export const SCOPED_QUERY_SCOPE = 'scope' as const;
export const GLOBAL_QUERY_SCOPE = 'global' as const;
export const MISSING_SCOPE_KEY = ['resource', 'scope-context-required'] as const;

/** Adds the canonical Resource scope to a query or mutation key exactly once. */
export function scopeResourceKey(
  scope: ResourceScope,
  queryKey: readonly unknown[],
  scopeId?: string,
): readonly unknown[] {
  if (scope === 'global') {
    if (queryKey[0] === GLOBAL_QUERY_SCOPE) return queryKey;
    return [GLOBAL_QUERY_SCOPE, ...queryKey];
  }

  if (
    scopeId &&
    queryKey[0] === SCOPED_QUERY_SCOPE &&
    queryKey[1] === scopeId
  ) {
    return queryKey;
  }

  if (
    !scopeId &&
    queryKey[0] === MISSING_SCOPE_KEY[0] &&
    queryKey[1] === MISSING_SCOPE_KEY[1]
  ) {
    return queryKey;
  }

  if (scopeId) return [SCOPED_QUERY_SCOPE, scopeId, ...queryKey];
  return [...MISSING_SCOPE_KEY, ...queryKey];
}
