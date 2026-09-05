import * as React from "react";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";

export interface FormHeaderTitleProps {
  icon?: React.ElementType<{ className?: string }> | undefined;
  children: React.ReactNode;
  className?: string;
}

export function FormHeaderTitle({
  icon: Icon,
  children,
  className,
}: FormHeaderTitleProps) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      {Icon ? (
        <Icon
          className="h-5 w-5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      ) : null}
      <span>{children}</span>
    </span>
  );
}
