"use client";

import * as React from "react";
import type {
  ResourceAuthorizationDefinition,
  ResourceDefinition,
} from "./contracts/resource-definition";
import {
  resolveResourceView,
  resolveResourceViews,
} from "../data-view/state";
import type { ResourceViewDefinition } from "../data-view/contracts";

export type ResourceAuthorizationStatus =
  "loading" | "ready" | "error" | "unavailable";

/**
 * The intentionally small authorization seam consumed by Resource Core.
 * Permission names remain feature configuration; Core only asks whether a
 * configured permission is currently granted.
 */
export interface ResourceAuthorization {
  readonly storeId?: string;
  readonly status: ResourceAuthorizationStatus;
  can: (permission: string) => boolean;
}

const ResourceAuthorizationContext = React.createContext<
  ResourceAuthorization | undefined
>(undefined);

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

export function useResourceAuthorization(): ResourceAuthorization | undefined {
  return React.useContext(ResourceAuthorizationContext);
}

export function createResourceAuthorization(
  options: {
    storeId?: string;
    status?: ResourceAuthorizationStatus;
    permissions?: readonly string[];
    authorized?: boolean;
  } = {}
): ResourceAuthorization {
  const permissions = new Set(options.permissions ?? []);
  const status = options.status ?? "ready";
  return {
    ...(options.storeId ? { storeId: options.storeId } : {}),
    status,
    can: (permission) =>
      status === "ready" &&
      (options.authorized === true || permissions.has(permission)),
  };
}

export function isResourceAuthorizationReady(
  authorization: ResourceAuthorization | undefined
): boolean {
  return authorization?.status === "ready";
}

export function authorizationAllows(
  permission: string | undefined,
  authorization: ResourceAuthorization | undefined
): boolean {
  if (!permission) return true;
  if (!authorization || !isResourceAuthorizationReady(authorization)) {
    return false;
  }
  try {
    return Boolean(authorization.can(permission));
  } catch {
    return false;
  }
}

export interface AuthorizedResourceViewResolution {
  /** The effective view, or null while access is unresolved/denied. */
  view: ResourceViewDefinition | null;
  /** Whether all access decisions are resolved; an allowed view may exist before this. */
  ready: boolean;
  /** Resource views that are allowed by the current authorization snapshot. */
  views: ResourceViewDefinition[];
  /** Views explicitly denied by ready Resource or view authorization. */
  deniedViews: ResourceViewDefinition[];
  /** Views awaiting Resource access or their own permission decision. */
  unresolvedViews: ResourceViewDefinition[];
}

/**
 * Resolve declarative Resource views before query or renderer execution.
 * Renderer registrations deliberately do not participate in this Core
 * decision; Admin UI performs that separate runtime lookup afterwards.
 */
export function resolveAuthorizedResourceViews(
  definition: Pick<
    ResourceDefinition<any, any, any, any, any, any, any>,
    "authorization" | "views"
  >,
  requestedId: string | undefined,
  authorization: ResourceAuthorization | undefined
): AuthorizedResourceViewResolution {
  const access = resolveResourceAccess(definition, authorization);
  const resourceViews = resolveResourceViews(definition.views);
  if (!access.ready) {
    return {
      view: null,
      ready: false,
      views: [],
      deniedViews: [],
      unresolvedViews: resourceViews,
    };
  }
  if (!access.read) {
    return {
      view: null,
      ready: true,
      views: [],
      deniedViews: resourceViews,
      unresolvedViews: [],
    };
  }

  const views: ResourceViewDefinition[] = [];
  const deniedViews: ResourceViewDefinition[] = [];
  const unresolvedViews: ResourceViewDefinition[] = [];
  for (const view of resourceViews) {
    if (view.permission && !isResourceAuthorizationReady(authorization)) {
      unresolvedViews.push(view);
    } else if (authorizationAllows(view.permission, authorization)) {
      views.push(view);
    } else {
      deniedViews.push(view);
    }
  }
  return {
    view:
      views.length > 0
        ? resolveResourceView(views, requestedId)
        : null,
    ready: unresolvedViews.length === 0,
    views,
    deniedViews,
    unresolvedViews,
  };
}

export interface ResolvedResourceAccess {
  protected: boolean;
  ready: boolean;
  read: boolean;
}

export function resolveResourceAccess(
  definition: Pick<
    ResourceDefinition<any, any, any, any, any, any, any>,
    "authorization"
  >,
  authorization: ResourceAuthorization | undefined
): ResolvedResourceAccess {
  const mapping = definition.authorization;
  const protectedResource = authorizationPermissions(mapping).length > 0;
  return {
    protected: protectedResource,
    ready: protectedResource
      ? isResourceAuthorizationReady(authorization)
      : true,
    read: authorizationAllows(mapping?.read, authorization),
  };
}

export function authorizationPermissions(
  mapping: ResourceAuthorizationDefinition | undefined
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
  return [
    ...new Set(
      values.filter((permission): permission is string => Boolean(permission))
    ),
  ];
}
