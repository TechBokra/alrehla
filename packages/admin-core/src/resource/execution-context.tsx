'use client';

import * as React from 'react';

export interface ResourceExecutionContext { readonly userId?: string }
const Context = React.createContext<ResourceExecutionContext | undefined>(undefined);

export function ResourceExecutionContextProvider({ value, children }: { value?: ResourceExecutionContext; children: React.ReactNode }) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useResourceExecutionContext = () => React.useContext(Context);
