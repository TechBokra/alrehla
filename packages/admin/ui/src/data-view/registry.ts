"use client";

import type * as React from "react";
import type {
  DataViewCapabilities,
  JsonValue,
  ResourceDataViewAdapter,
  ResourceDefinition,
  ResourceViewDefinition,
} from "@eng-mohamedelsayed/admin-core";

export interface ViewRendererProps {
  resource: ResourceDefinition<any, any, any, any, any, any, any>;
  view: ResourceViewDefinition;
  registration: ViewRegistration;
  dataView: ResourceDataViewAdapter<any, any, any>;
  config: Record<string, JsonValue>;
  state: Record<string, JsonValue>;
}

export interface ViewRegistration {
  type: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  capabilities: DataViewCapabilities;
  renderer: React.ComponentType<ViewRendererProps>;
}

export interface ViewRegistry {
  readonly registrations: readonly ViewRegistration[];
  get: (type: string) => ViewRegistration | undefined;
  has: (type: string) => boolean;
}

function assertUnique(registrations: readonly ViewRegistration[]) {
  const seen = new Set<string>();
  for (const registration of registrations) {
    if (!registration.type.trim()) {
      throw new Error("DataView view registrations require a non-empty type.");
    }
    if (seen.has(registration.type)) {
      throw new Error(
        `Duplicate DataView view registration for type \"${registration.type}\".`
      );
    }
    seen.add(registration.type);
  }
}

export function createViewRegistry(
  registrations: readonly ViewRegistration[]
): ViewRegistry {
  assertUnique(registrations);
  const byType = new Map(registrations.map((registration) => [registration.type, registration]));
  return {
    registrations: [...registrations],
    get: (type) => byType.get(type),
    has: (type) => byType.has(type),
  };
}

export function composeViewRegistries(
  ...registries: readonly ViewRegistry[]
): ViewRegistry {
  return createViewRegistry(
    registries.flatMap((registry) => registry.registrations)
  );
}
