import type { DataViewCsvRow } from '../../data-view/contracts';
import type { ResourceAuthorization } from '../authorization';
import { authorizationAllows } from '../authorization';
import type {
  ResourceCapabilities,
  ResourceDefinition,
} from './resource-definition';
import type { ResourceListResult } from './resource-query';
import { DEFAULT_RESOURCE_PAGINATION } from './resource-pagination';

export const DEFAULT_RESOURCE_CAPABILITIES = {
  create: true,
  update: true,
  delete: true,
  import: false,
  export: true,
  bulkActions: true,
  selection: true,
} as const satisfies Required<ResourceCapabilities>;

export const DEFAULT_RESOURCE_ROW_ACTIONS = {
  edit: true,
  delete: true,
} as const;

export const DEFAULT_RESOURCE_BULK_ACTIONS = {
  delete: true,
} as const;

type AnyResourceDefinition = ResourceDefinition<
  unknown,
  unknown,
  unknown,
  ResourceListResult<unknown>,
  unknown,
  DataViewCsvRow,
  string
>;

export interface ResourceActionAvailability {
  create?: boolean;
  update?: boolean;
  delete?: boolean;
  deleteMany?: boolean;
  import?: boolean;
}

export type ResolvedResourceCapabilities = Required<ResourceCapabilities>;

export function resolveResourceCapabilities<
  TData,
  TCreateInput = unknown,
  TUpdateInput = unknown,
  TQueryRaw = ResourceListResult<TData>,
  TValue = unknown,
  TImport = DataViewCsvRow,
  TDeleteInput = string,
>(
  definition: ResourceDefinition<
    TData,
    TCreateInput,
    TUpdateInput,
    TQueryRaw,
    TValue,
    TImport,
    TDeleteInput
  >,
  availability: ResourceActionAvailability = {},
  authorization?: ResourceAuthorization,
): ResolvedResourceCapabilities {
  const configured = definition.capabilities ?? {};
  const hasCreate = availability.create ?? Boolean(definition.forms?.create && definition.mutations?.create);
  const hasUpdate = availability.update ?? Boolean(definition.forms?.update && definition.mutations?.update);
  const hasDelete = availability.delete ?? Boolean(definition.mutations?.delete);
  const hasImport = availability.import ?? Boolean(definition.import && definition.mutations?.import);
  const selectionDisabled =
    definition.dataView.checkbox === false || definition.dataView.selection?.enabled === false;
  const hasBulk = Boolean(
    definition.mutations?.deleteMany ||
    (definition.bulkDelete?.strategy === 'individual' && hasDelete) ||
    definition.dataView.bulkActions?.length ||
    definition.bulkActions?.actions?.length,
  );
  const allows = (operation: 'create' | 'update' | 'delete' | 'import' | 'export') =>
    authorizationAllows(definition.authorization?.[operation], authorization);
  const bulkPermissions = definition.authorization?.bulkActions;
  const bulkAllowed = !bulkPermissions ||
    (Array.isArray(bulkPermissions) ? bulkPermissions : [bulkPermissions])
      .every((permission) => authorizationAllows(permission, authorization));

  return {
    create: (configured.create ?? DEFAULT_RESOURCE_CAPABILITIES.create) && hasCreate && allows('create'),
    update: (configured.update ?? DEFAULT_RESOURCE_CAPABILITIES.update) && hasUpdate && allows('update'),
    delete: (configured.delete ?? DEFAULT_RESOURCE_CAPABILITIES.delete) && hasDelete && allows('delete'),
    import: (configured.import ?? DEFAULT_RESOURCE_CAPABILITIES.import) && hasImport && allows('import'),
    export: (configured.export ?? DEFAULT_RESOURCE_CAPABILITIES.export) && allows('export') &&
      Boolean(definition.export ?? definition.dataView.exportConfig),
    selection: (configured.selection ?? DEFAULT_RESOURCE_CAPABILITIES.selection) && !selectionDisabled,
    bulkActions: (configured.bulkActions ?? DEFAULT_RESOURCE_CAPABILITIES.bulkActions) &&
      (configured.selection ?? DEFAULT_RESOURCE_CAPABILITIES.selection) && !selectionDisabled && hasBulk && bulkAllowed,
  };
}

export function resolveResourceRowActions<
  TData,
  TCreateInput,
  TUpdateInput,
  TQueryRaw,
  TValue,
  TImport,
  TDeleteInput,
>(
  definition: ResourceDefinition<
    TData,
    TCreateInput,
    TUpdateInput,
    TQueryRaw,
    TValue,
    TImport,
    TDeleteInput
  >,
  capabilities: ResolvedResourceCapabilities,
  authorization?: ResourceAuthorization,
) {
  return {
    edit: capabilities.update && (definition.rowActions?.edit ?? DEFAULT_RESOURCE_ROW_ACTIONS.edit),
    delete: capabilities.delete && (definition.rowActions?.delete ?? DEFAULT_RESOURCE_ROW_ACTIONS.delete),
    actions: [
      ...(definition.dataView.rowActions ?? []),
      ...(definition.rowActions?.actions ?? []),
    ].filter((action) => authorizationAllows(action.permission, authorization)),
  };
}

export function resolveResourceBulkActions<
  TData,
  TCreateInput,
  TUpdateInput,
  TQueryRaw,
  TValue,
  TImport,
  TDeleteInput,
>(
  definition: ResourceDefinition<
    TData,
    TCreateInput,
    TUpdateInput,
    TQueryRaw,
    TValue,
    TImport,
    TDeleteInput
  >,
  capabilities: ResolvedResourceCapabilities,
  availability: ResourceActionAvailability = {},
  authorization?: ResourceAuthorization,
) {
  const canDeleteMany = availability.deleteMany ?? Boolean(definition.mutations?.deleteMany);
  const canDelete = availability.delete ?? Boolean(definition.mutations?.delete);
  return {
    delete: capabilities.bulkActions && (definition.bulkActions?.delete ?? DEFAULT_RESOURCE_BULK_ACTIONS.delete) &&
      (canDeleteMany || (definition.bulkDelete?.strategy === 'individual' && canDelete)),
    actions: [
      ...(definition.dataView.bulkActions ?? []),
      ...(definition.bulkActions?.actions ?? []),
    ].filter((action) => authorizationAllows(action.permission, authorization)),
  };
}

export type ResourceDefinitionForCapabilities = AnyResourceDefinition;

export function resolveResourcePagination<
  TData,
  TCreateInput,
  TUpdateInput,
  TQueryRaw,
  TValue,
  TImport,
  TDeleteInput,
>(
  definition: ResourceDefinition<
    TData,
    TCreateInput,
    TUpdateInput,
    TQueryRaw,
    TValue,
    TImport,
    TDeleteInput
  >,
) {
  return {
    enabled: definition.pagination?.enabled ?? DEFAULT_RESOURCE_PAGINATION.enabled,
    pageSizeOptions: definition.pagination?.pageSizeOptions ??
      definition.dataView.pageSizeOptions ?? DEFAULT_RESOURCE_PAGINATION.pageSizeOptions,
  };
}
