import {
  AppMutationError,
  normalizeMutationError,
} from '@alrehla/mutations';

export const RESOURCE_SCOPE_CONTEXT_REQUIRED = 'RESOURCE_SCOPE_CONTEXT_REQUIRED';

/** Missing scope is a client execution-context failure, not authorization. */
export class ResourceContextError extends Error {
  readonly type = 'execution_context';
  readonly code: string;
  readonly details?: unknown;

  constructor(
    message: string,
    options: { code?: string; details?: unknown } = {},
  ) {
    super(message);
    this.name = 'ResourceContextError';
    this.code = options.code ?? RESOURCE_SCOPE_CONTEXT_REQUIRED;
    this.details = options.details;
  }
}

export function createMissingResourceScopeError(resourceName: string) {
  return new ResourceContextError(
    `The ${resourceName} resource requires a scopeId execution context.`,
    { details: { resourceName } },
  );
}

export type ResourceErrorContext =
  | 'query'
  | 'create'
  | 'update'
  | 'delete'
  | 'deleteMany'
  | 'reorder'
  | 'import'
  | 'form'
  | 'authorization'
  | 'execution_context'
  | 'bulk'
  | 'partial';

export type ResourceErrorSeverity = 'error' | 'warning';

export interface ResourcePartialOutcome {
  succeededIds: string[];
  failedIds: string[];
}

export interface ResourceErrorState {
  context: ResourceErrorContext;
  error: AppMutationError;
  severity: ResourceErrorSeverity;
  blocking: boolean;
  retryable: boolean;
  title: string;
  description: string;
  fieldErrors?: Record<string, string[]>;
  partial?: ResourcePartialOutcome;
}

export interface ResourceErrorOptions {
  resourceLabel?: string;
  singularLabel?: string;
  operationLabel?: string;
  partial?: ResourcePartialOutcome;
}

const safeMessageTypes = new Set([
  'validation',
  'authentication',
  'authorization',
  'not_found',
  'conflict',
  'execution_context',
]);

function cleanLabel(value: string | undefined, fallback: string) {
  return value?.trim() || fallback;
}

function defaultTitle(
  context: ResourceErrorContext,
  resourceLabel: string,
  singularLabel: string,
) {
  switch (context) {
    case 'query': return `تعذر تحميل ${resourceLabel}.`;
    case 'create': return `تعذر إنشاء ${singularLabel}.`;
    case 'update': return `تعذر تحديث ${singularLabel}.`;
    case 'delete': return `تعذر حذف ${singularLabel}.`;
    case 'deleteMany':
    case 'bulk': return `تعذر إكمال الإجراء على ${resourceLabel}.`;
    case 'reorder': return `تعذر إعادة ترتيب ${resourceLabel}.`;
    case 'import': return `تعذر استيراد ${resourceLabel}.`;
    case 'form': return 'تعذر حفظ التغييرات.';
    case 'authorization': return 'غير مصرح بهذا الإجراء.';
    case 'execution_context': return 'سياق المورد غير متاح.';
    case 'partial': return `اكتملت عملية ${resourceLabel} جزئياً.`;
  }
}

function defaultDescription(
  context: ResourceErrorContext,
  error: AppMutationError,
  resourceLabel: string,
) {
  if (safeMessageTypes.has(error.type ?? '') && error.message) return error.message;
  if (error.type === 'cancelled') return '';
  if (error.type === 'network') return 'تعذر الوصول إلى الخادم. تحقق من الاتصال وحاول مرة أخرى.';
  if (context === 'query') return `تعذر تحميل ${resourceLabel}. حاول مرة أخرى.`;
  return 'تعذر إكمال العملية. حاول مرة أخرى.';
}

function retryable(error: AppMutationError, context: ResourceErrorContext) {
  if (context === 'authorization' || context === 'execution_context') return false;
  return ['network', 'database', 'server', 'timeout', 'unknown'].includes(
    error.type ?? 'unknown',
  );
}

function readIds(value: unknown, keys: readonly string[]) {
  if (!value || typeof value !== 'object') return [];
  for (const key of keys) {
    const candidate = (value as Record<string, unknown>)[key];
    if (Array.isArray(candidate)) {
      const ids = candidate.filter((id): id is string => typeof id === 'string');
      if (ids.length) return [...new Set(ids)];
    }
  }
  return [];
}

export function extractResourcePartialOutcome(
  value: unknown,
): ResourcePartialOutcome | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const source = value as Record<string, unknown>;
  const nested =
    source.details && typeof source.details === 'object'
      ? source.details
      : source.data && typeof source.data === 'object'
        ? source.data
        : source.result && typeof source.result === 'object'
          ? source.result
          : source;
  const succeededIds = readIds(nested, ['succeededIds', 'successIds', 'ids']);
  const failedIds = readIds(nested, ['failedIds']);
  if (!succeededIds.length && !failedIds.length) return undefined;
  return { succeededIds, failedIds };
}

export function resolveResourceError(
  error: unknown,
  context: ResourceErrorContext,
  options: ResourceErrorOptions = {},
): ResourceErrorState | null {
  if (error === null || error === undefined) return null;
  const normalized = normalizeMutationError(error);
  if (normalized.type === 'cancelled') return null;
  const resourceLabel = cleanLabel(options.resourceLabel, 'البيانات');
  const singularLabel = cleanLabel(options.singularLabel, 'السجل');
  const partial = options.partial ?? extractResourcePartialOutcome(normalized.details);
  return {
    context,
    error: normalized,
    severity: context === 'partial' ? 'warning' : 'error',
    blocking: ['query', 'authorization', 'execution_context'].includes(context),
    retryable: retryable(normalized, context),
    title: defaultTitle(context, resourceLabel, singularLabel),
    description: defaultDescription(context, normalized, resourceLabel),
    ...(normalized.fieldErrors ? { fieldErrors: normalized.fieldErrors } : {}),
    ...(partial ? { partial } : {}),
  };
}
