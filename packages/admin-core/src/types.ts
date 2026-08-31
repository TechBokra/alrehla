/** Generic resource identifiers. Domain catalogs belong in applications. */
export type AdminResourceId = string;
export type AdminPermission = string;

export interface AdminResourceDefinition {
  id: AdminResourceId;
  label: string;
  route: string;
  permission?: AdminPermission;
}

export type AdminQueryKey = readonly [string, ...ReadonlyArray<unknown>];

export interface AdminSession {
  userId: string;
  role: string;
  permissions: Readonly<Record<string, boolean>>;
}
