export type QueryKeyValue =
  | string
  | number
  | boolean
  | null
  | QueryKeyValue[]
  | { readonly [key: string]: QueryKeyValue };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Produces a stable, JSON-safe query-key value. Undefined properties are
 * omitted and object keys are sorted so equivalent requests share a cache key.
 */
export const canonicalizeQueryParams = (value: unknown): QueryKeyValue => {
  if (value === undefined) return null;
  if (value === null) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.filter((entry) => entry !== undefined).map(canonicalizeQueryParams);
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .filter((key) => value[key] !== undefined && typeof value[key] !== 'function')
        .sort()
        .map((key) => [key, canonicalizeQueryParams(value[key])]),
    ) as { [key: string]: QueryKeyValue };
  }
  return String(value);
};

export const createResourceKeys = <TParams extends object = Record<string, unknown>>(
  resource: string,
) => {
  const all = [resource] as const;
  const lists = () => [...all, 'list'] as const;
  const list = (params: TParams) => [...lists(), canonicalizeQueryParams(params)] as const;
  const details = () => [...all, 'detail'] as const;
  const detail = (id: string | number) => [...details(), String(id)] as const;

  return { all, lists, list, details, detail } as const;
};
