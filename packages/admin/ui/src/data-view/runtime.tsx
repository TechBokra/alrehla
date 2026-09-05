"use client";

import * as React from "react";
import type { ViewRegistry } from "./registry";

const ViewRegistryContext = React.createContext<ViewRegistry | null>(null);

export interface ViewRuntimeProviderProps {
  registry: ViewRegistry;
  children: React.ReactNode;
}

export function ViewRuntimeProvider({
  registry,
  children,
}: ViewRuntimeProviderProps) {
  return (
    <ViewRegistryContext.Provider value={registry}>
      {children}
    </ViewRegistryContext.Provider>
  );
}

export function useViewRegistry(): ViewRegistry {
  const registry = React.useContext(ViewRegistryContext);
  if (!registry) {
    throw new Error(
      "useViewRegistry must be used within a <ViewRuntimeProvider>."
    );
  }
  return registry;
}

export function useOptionalViewRegistry(): ViewRegistry | null {
  return React.useContext(ViewRegistryContext);
}
