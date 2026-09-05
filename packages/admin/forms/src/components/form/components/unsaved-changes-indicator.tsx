"use client";

import * as React from "react";
import { useFormContext } from "../context";
import { Badge } from "@eng-mohamedelsayed/admin-ui/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";

export interface UnsavedChangesIndicatorProps {
  form?: any;
  className?: string | undefined;
}

export function UnsavedChangesIndicator({ form: formProp, className }: UnsavedChangesIndicatorProps) {
  const form = useFormContext(formProp);
  if (!form) return null;

  return (
    <form.Subscribe selector={(state: any) => ({ isDirty: state.isDirty })}>
      {({ isDirty }: { isDirty: boolean }) => {
        if (!isDirty) return null;
        return (
          <Badge variant="outline" className={cn("border-amber-500/50 bg-amber-500/10 text-amber-600 flex items-center gap-1.5 px-2.5 py-1 text-xs", className)}>
            <AlertTriangle className="h-3.5 w-3.5" />
            Unsaved Changes
          </Badge>
        );
      }}
    </form.Subscribe>
  );
}
