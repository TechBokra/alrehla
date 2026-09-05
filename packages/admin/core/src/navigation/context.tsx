"use client";

import * as React from "react";
import type {
  AdminLocationAdapter,
  AdminNavigationAdapter,
  AdminNavigationContextValue,
} from "./contracts";

const AdminNavigationContext = React.createContext<
  AdminNavigationContextValue | undefined
>(undefined);

export interface AdminNavigationProviderProps extends AdminNavigationContextValue {
  children: React.ReactNode;
}

/** Installs a framework adapter for URL state and Resource actions. */
export function AdminNavigationProvider({
  navigation,
  location,
  children,
}: AdminNavigationProviderProps) {
  const value = React.useMemo<AdminNavigationContextValue>(
    () => ({ navigation, location }),
    [location, navigation]
  );

  return (
    <AdminNavigationContext.Provider value={value}>
      {children}
    </AdminNavigationContext.Provider>
  );
}

export function useAdminNavigationContext(): AdminNavigationContextValue {
  const context = React.useContext(AdminNavigationContext);
  if (!context) {
    throw new Error(
      "Admin navigation is unavailable. Wrap the admin UI in AdminNavigationProvider."
    );
  }
  return context;
}

export function useAdminNavigation(): AdminNavigationAdapter {
  return useAdminNavigationContext().navigation;
}

export function useAdminLocation(): AdminLocationAdapter {
  return useAdminNavigationContext().location;
}
