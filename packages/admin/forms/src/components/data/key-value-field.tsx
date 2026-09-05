"use client";

import * as React from "react";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";
import { Input } from "@eng-mohamedelsayed/admin-ui/components/ui/input";
import { Button } from "@eng-mohamedelsayed/admin-ui/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
}

export interface KeyValueFieldProps {
  id?: string | undefined;
  value?: KeyValuePair[] | undefined;
  onChange?: ((pairs: KeyValuePair[]) => void) | undefined;
  keyPlaceholder?: string | undefined;
  valuePlaceholder?: string | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  className?: string | undefined;
}

export function KeyValueField({
  id,
  value = [],
  onChange,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
  disabled,
  readOnly,
  className,
}: KeyValueFieldProps) {
  const handleAddRow = () => {
    if (disabled || readOnly) return;
    const newPair: KeyValuePair = {
      id: `kv_${Date.now()}`,
      key: "",
      value: "",
    };
    onChange?.([...value, newPair]);
  };

  const handleUpdateRow = (index: number, field: "key" | "value", text: string) => {
    if (disabled || readOnly) return;
    const updated = value.map((pair, idx) => {
      if (idx !== index) return pair;
      return { ...pair, [field]: text };
    });
    onChange?.(updated);
  };

  const handleRemoveRow = (index: number) => {
    if (disabled || readOnly) return;
    onChange?.(value.filter((_, idx) => idx !== index));
  };

  return (
    <div className={cn("space-y-2.5", className)}>
      {value.length === 0 ? (
        <div className="rounded-md border border-dashed p-4 text-center text-muted-foreground text-xs">
          No key-value pairs added.
        </div>
      ) : (
        value.map((pair, idx) => (
          <div key={pair.id || idx} className="flex items-center gap-2">
            <Input
              value={pair.key}
              onChange={(e) => handleUpdateRow(idx, "key", e.target.value)}
              placeholder={keyPlaceholder}
              disabled={disabled}
              readOnly={readOnly}
              className="font-mono text-xs h-8 flex-1"
            />
            <Input
              value={pair.value}
              onChange={(e) => handleUpdateRow(idx, "value", e.target.value)}
              placeholder={valuePlaceholder}
              disabled={disabled}
              readOnly={readOnly}
              className="text-xs h-8 flex-1"
            />
            {!(disabled || readOnly) && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => handleRemoveRow(idx)}
                className="text-destructive hover:text-destructive shrink-0"
                title="Remove pair"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))
      )}

      {!(disabled || readOnly) && (
        <Button type="button" variant="outline" size="sm" onClick={handleAddRow} className="h-7 text-xs">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Row
        </Button>
      )}
    </div>
  );
}
