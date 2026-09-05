"use client";

import * as React from "react";
import { useDataView } from "./data-view-context";

export interface DataViewFooterProps {
  className?: string | undefined;
  children?: React.ReactNode | undefined;
}

export function DataViewFooter({
  className,
  children,
}: DataViewFooterProps) {
  const { activeCapabilities } = useDataView();

  // If the active view explicitly does not support pagination (e.g. Tree or Calendar), hide the footer
  if (activeCapabilities.pagination === false) {
    return null;
  }

  if (!children) {
    return null;
  }

  return <div className={className}>{children}</div>;
}
