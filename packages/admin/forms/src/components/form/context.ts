"use client";

import { createFormHookContexts } from "@tanstack/react-form";
import * as React from "react";

export const { fieldContext, formContext, useFieldContext } =
  createFormHookContexts();

export function useFormContext(formProp?: any) {
  const ctx = React.useContext(formContext);
  return formProp || ctx || undefined;
}

export function normalizeFieldErrors(errors: unknown[]): string | undefined {
  if (!errors || errors.length === 0) return undefined;
  const messages = errors
    .map((err) => {
      if (!err) return "";
      if (typeof err === "string") return err;
      if (
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof (err as { message?: unknown }).message === "string"
      ) {
        return (err as { message: string }).message;
      }
      return String(err);
    })
    .filter(Boolean);

  return messages.length > 0 ? messages.join(", ") : undefined;
}
