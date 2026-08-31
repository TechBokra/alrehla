'use client';

import * as React from 'react';
import type {
  ResourceAuthorizationDefinition,
  ResourceDefinition,
} from './contracts/resource-definition';

export type ResourceAuthorizationStatus =
  | 'loading'
  | 'ready'
  | 'error'
  | 'unavailable';

/**
 * UI-only authorization seam. Feature permission names remain application
 * configuration; backend/RLS/RPC authorization stays authoritative.
 */
export interface ResourceAuthorization {
  readonly status: ResourceAuthorizationStatus;
  can(permission: string): boolean;
}

const ResourceAuthorizationContext = React.createContext<ResourceAuthorization | undefined>(
  undefined,
);

export function ResourceAuthorizationProvider({
  value,
  children,
}: {
  value?: ResourceAuthorization;
  children: React.ReactNode;
}) {
  return (
    <ResourceAuthorizationContext.Provider value={value}>
      {children}
    </ResourceAuthorizationContext.Provider>
  );
}

export const useResourceAuthorization = (): ResourceAuthorization | undefined =>
  React.useContext(ResourceAuthorizationContext);

export function createResourceAuthorization(
  options: {
    status?: ResourceAuthorizationStatus;
    permissions?: readonly string[];
    authorized?: boolean;
  } = {},
): ResourceAuthorization {
  const permissions = new Set(options.permissions ?? []);
  const status = options.status ?? 'ready';
  return {
    status,
    can: (permission) =>
      status === 'ready' &&
      (options.authorized === true || permissions.has(permission)),
  };
}

export const isResourceAuthorizationReady = (
  authorization: ResourceAuthorization | undefined,
): boolean => authorization?.status === 'ready';

export function authorizationAllows(
  permission: string | undefined,
  authorization: ResourceAuthorization | undefined,
): boolean {
  if (!permission) return true;
  if (!authorization || !isResourceAuthorizationReady(authorization)) return false;
  try {
    return Boolean(authorization.can(permission));
  } catch {
    return false;
  }
}

export interface ResolvedResourceAccess {
  protected: boolean;
  ready: boolean;
  read: boolean;
}

export function authorizationPermissions(
  mapping: ResourceAuthorizationDefinition | undefined,
): string[] {
  if (!mapping) return [];
  const values = [
    mapping.read,
    mapping.create,
    mapping.update,
    mapping.delete,
    mapping.import,
    mapping.export,
    ...(Array.isArray(mapping.bulkActions)
      ? mapping.bulkActions
      : [mapping.bulkActions]),
  ];
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

export function resolveResourceAccess(
  definition: Pick<ResourceDefinition<unknown>, 'authorization'>,
  authorization: ResourceAuthorization | undefined,
): ResolvedResourceAccess {
  const protectedResource = authorizationPermissions(definition.authorization).length > 0;
  return {
    protected: protectedResource,
    ready: protectedResource ? isResourceAuthorizationReady(authorization) : true,
    read: authorizationAllows(definition.authorization?.read, authorization),
  };
}
