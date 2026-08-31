export interface ResourcePaginationDefinition {
  enabled?: boolean;
  pageSizeOptions?: readonly number[];
}

export const DEFAULT_RESOURCE_PAGINATION = {
  enabled: true,
  pageSizeOptions: [10, 20, 30, 50, 100],
} as const;
