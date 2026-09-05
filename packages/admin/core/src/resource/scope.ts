export type ResourceScope = "store" | "global";

export const DEFAULT_RESOURCE_SCOPE: ResourceScope = "store";

export const STORE_QUERY_SCOPE = "store" as const;
export const GLOBAL_QUERY_SCOPE = "global" as const;

/** Adds the canonical Resource scope to a query or mutation key exactly once. */
export function scopeResourceKey(
  scope: ResourceScope,
  queryKey: readonly unknown[],
  storeId?: string
): readonly unknown[] {
  if (scope === "global") {
    if (queryKey[0] === GLOBAL_QUERY_SCOPE) return queryKey;
    return [GLOBAL_QUERY_SCOPE, ...queryKey];
  }

  if (storeId && queryKey[0] === STORE_QUERY_SCOPE && queryKey[1] === storeId) {
    return queryKey;
  }

  if (
    !storeId &&
    queryKey[0] === "resource" &&
    queryKey[1] === "store-context-required"
  ) {
    return queryKey;
  }

  if (storeId) return [STORE_QUERY_SCOPE, storeId, ...queryKey];

  return ["resource", "store-context-required", ...queryKey];
}

/** @deprecated Use scopeResourceKey("store", queryKey, storeId). */
export function scopeResourceQueryKey(
  storeId: string,
  queryKey: readonly unknown[]
): readonly unknown[] {
  return scopeResourceKey("store", queryKey, storeId);
}
