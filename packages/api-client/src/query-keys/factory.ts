export type QueryKeyValue =
  | string
  | number
  | boolean
  | null
  | QueryKeyValue[]
  | { readonly [key: string]: QueryKeyValue };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isPlainRecord = (value: Record<string, unknown>): boolean => {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

/**
 * Produces a stable, JSON-safe query-key value. Undefined properties are
 * omitted and object keys are sorted so equivalent requests share a cache key.
 */
export const canonicalizeQueryParams = (value: unknown): QueryKeyValue => {
  if (value === undefined) return null;
  if (value === null) return null;
  if (typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'function' || typeof value === 'symbol' || typeof value === 'bigint') {
    return null;
  }
  if (Array.isArray(value)) {
    return value
      .filter((entry) => entry !== undefined && typeof entry !== 'function')
      .map(canonicalizeQueryParams);
  }
  if (isRecord(value) && isPlainRecord(value)) {
    const normalized: { [key: string]: QueryKeyValue } = {};
    for (const key of Object.keys(value).sort()) {
      if (value[key] === undefined || typeof value[key] === 'function') continue;
      normalized[key] = canonicalizeQueryParams(value[key]);
    }
    return normalized;
  }
  return null;
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
