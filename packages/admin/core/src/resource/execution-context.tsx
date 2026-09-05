"use client";

import * as React from "react";
import type { ResourceExecutionContext } from "./contracts/resource-query";

const ResourceExecutionContextValue =
  React.createContext<ResourceExecutionContext | undefined>(undefined);

export function ResourceExecutionContextProvider({
  value,
  children,
}: {
  value?: ResourceExecutionContext;
  children: React.ReactNode;
}) {
  return (
    <ResourceExecutionContextValue.Provider value={value}>
      {children}
    </ResourceExecutionContextValue.Provider>
  );
}

export function useResourceExecutionContext():
  | ResourceExecutionContext
  | undefined {
  return React.useContext(ResourceExecutionContextValue);
}
