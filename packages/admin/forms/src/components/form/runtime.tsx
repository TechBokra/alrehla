"use client";

import * as React from "react";
import { adminFormHooks, type AdminFormHooks } from "./hooks";

export interface FormRuntimeHooks {
  useAppForm: AdminFormHooks["useAppForm"];
}

const defaultRuntime: FormRuntimeHooks = {
  useAppForm: adminFormHooks.useAppForm as FormRuntimeHooks["useAppForm"],
};

const FormRuntimeContext = React.createContext<FormRuntimeHooks>(defaultRuntime);

export function FormRuntimeProvider({
  hooks,
  children,
}: {
  hooks: FormRuntimeHooks;
  children: React.ReactNode;
}) {
  return (
    <FormRuntimeContext.Provider value={hooks}>
      {children}
    </FormRuntimeContext.Provider>
  );
}

export function useFormRuntime(): FormRuntimeHooks {
  return React.useContext(FormRuntimeContext);
}
