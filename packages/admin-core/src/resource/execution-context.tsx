'use client';

import * as React from 'react';

export interface ResourceExecutionContext {
  /** Generic isolation boundary for scoped resources. */
  readonly scopeId?: string;
  /** Optional caller identity metadata; never used as backend authorization. */
  readonly userId?: string;
}
const Context = React.createContext<ResourceExecutionContext | undefined>(undefined);

export function ResourceExecutionContextProvider({ value, children }: { value?: ResourceExecutionContext; children: React.ReactNode }) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useResourceExecutionContext = () => React.useContext(Context);
