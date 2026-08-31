'use client';

import * as React from 'react';
import type {
  AdminLocationAdapter,
  AdminNavigationAdapter,
  AdminNavigationContextValue,
} from './contracts';

const AdminNavigationContext = React.createContext<AdminNavigationContextValue | undefined>(
  undefined,
);

export interface AdminNavigationProviderProps {
  navigation: AdminNavigationAdapter;
  location: AdminLocationAdapter;
  children: React.ReactNode;
}

export function AdminNavigationProvider({
  navigation,
  location,
  children,
}: AdminNavigationProviderProps) {
  const value = React.useMemo<AdminNavigationContextValue>(
    () => ({ navigation, location }),
    [location, navigation],
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
      'Admin navigation is unavailable. Wrap the application in AdminNavigationProvider.',
    );
  }
  return context;
}

export const useAdminNavigation = (): AdminNavigationAdapter =>
  useAdminNavigationContext().navigation;

export const useAdminLocation = (): AdminLocationAdapter =>
  useAdminNavigationContext().location;
