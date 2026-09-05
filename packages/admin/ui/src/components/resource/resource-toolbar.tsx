import * as React from "react";
import { cn } from "../../lib/utils";

export { ResourcePage, ResourceToolbar } from "../layouts/resource-page";

export interface ResourceToolbarActionsProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function ResourceToolbarActions({
  className,
  ...props
}: ResourceToolbarActionsProps) {
  return (
    <div
      className={cn("ml-auto flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  );
}
