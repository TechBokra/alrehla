"use client";

import * as React from "react";
import { FilterX } from "lucide-react";
import { Button } from "../../ui/button";
import {
  Filters,
  type Filter,
  type FilterFieldConfig,
  type FilterOption,
} from "../../reui/filters";
import type {
  DataViewFilterDefinition,
  DataViewFilterValue,
} from "@eng-mohamedelsayed/admin-core/data-view";

export interface DataViewFilterControlsProps {
  definitions: readonly DataViewFilterDefinition[];
  values: Record<string, DataViewFilterValue>;
  onChange: (id: string, value: DataViewFilterValue | undefined) => void;
  onReset: () => void;
  className?: string | undefined;
  variant?: ("solid" | "default") | undefined;
  size?: ("sm" | "default" | "lg") | undefined;
  enableShortcut?: boolean | undefined;
  shortcutKey?: string | undefined;
  shortcutLabel?: string | undefined;
  trigger?: React.ReactNode | undefined;
  debounceMs?: number | undefined;
}

/**
 * Maps DataViewFilterDefinition objects to ReUI FilterFieldConfig.
 */
export function mapDataViewFilterDefinitionsToReuiFields(
  definitions: readonly DataViewFilterDefinition[]
): FilterFieldConfig<unknown>[] {
  return definitions.map((def) => {
    let type: FilterFieldConfig<unknown>["type"] = "select";
    if (def.type === "multi-select") {
      type = "multiselect";
    } else if (def.type === "text") {
      type = "text";
    } else if (
      def.type === "single-select" ||
      def.type === "enum" ||
      def.type === "status" ||
      def.type === "boolean"
    ) {
      type = "select";
    } else {
      type = "custom";
    }

    const options: FilterOption<string>[] | undefined =
      def.type === "boolean"
        ? [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]
        : def.options?.map((opt) => {
            const Icon = opt.icon;
            return {
              label: opt.label,
              value: String(opt.value),
              ...(Icon ? { icon: <Icon className="h-4 w-4" /> } : {}),
            };
          });

    const fieldConfig: FilterFieldConfig<string> = {
      key: def.id,
      label: def.label,
      type,
      ...(options ? { options } : {}),
      ...(def.placeholder ? { placeholder: def.placeholder } : {}),
      ...(def.render
        ? {
            customRenderer: ({ values, onChange }) =>
              def.render?.({
                value:
                  values.length === 0
                    ? undefined
                    : values.length === 1
                      ? (values[0] as DataViewFilterValue)
                      : (values as string[]),
                onChange: (next) => {
                  if (next === undefined || next === null) onChange([]);
                  else if (Array.isArray(next)) onChange(next as string[]);
                  else onChange([String(next)]);
                },
              }),
          }
        : {}),
    };

    return fieldConfig as FilterFieldConfig<unknown>;
  });
}

/**
 * Converts Record<string, DataViewFilterValue> into ReUI Filter[].
 */
export function mapFilterValuesToReuiFilters(
  values: Record<string, DataViewFilterValue>,
  definitions: readonly DataViewFilterDefinition[]
): Filter[] {
  const defMap = new Map(definitions.map((d) => [d.id, d]));
  const result: Filter[] = [];

  for (const [key, val] of Object.entries(values)) {
    if (val === undefined || val === null || val === "") continue;
    const def = defMap.get(key);

    if (Array.isArray(val)) {
      if (val.length === 0) continue;
      result.push({
        id: key,
        field: key,
        operator: "is_any_of",
        values: val.map(String),
      });
    } else if (typeof val === "boolean") {
      result.push({
        id: key,
        field: key,
        operator: "is",
        values: [String(val)],
      });
    } else if (typeof val === "number" || typeof val === "string") {
      const operator = def?.type === "text" ? "contains" : "is";
      result.push({
        id: key,
        field: key,
        operator,
        values: [String(val)],
      });
    } else if (typeof val === "object") {
      const range = val as { from?: string | number; to?: string | number };
      const parts = [
        range.from !== undefined ? String(range.from) : "",
        range.to !== undefined ? String(range.to) : "",
      ].filter(Boolean);
      if (parts.length > 0) {
        result.push({
          id: key,
          field: key,
          operator: "between",
          values: parts,
        });
      }
    }
  }

  return result;
}

export function DataViewFilterControls({
  definitions,
  values,
  onChange,
  onReset,
  className,
  variant = "default",
  size = "sm",
  enableShortcut,
  shortcutKey,
  shortcutLabel,
  trigger,
  debounceMs = 300,
}: DataViewFilterControlsProps) {
  const [localValues, setLocalValues] = React.useState(values);

  React.useEffect(() => {
    setLocalValues(values);
  }, [values]);

  const timersRef = React.useRef<Map<string, number>>(new Map());

  const triggerChange = React.useCallback(
    (id: string, nextValue: DataViewFilterValue | undefined, immediate = false) => {
      setLocalValues((prev) => {
        if (nextValue === undefined) {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        }
        return { ...prev, [id]: nextValue };
      });

      const existingTimer = timersRef.current.get(id);
      if (existingTimer !== undefined) {
        window.clearTimeout(existingTimer);
        timersRef.current.delete(id);
      }

      if (immediate || debounceMs <= 0) {
        onChange(id, nextValue);
      } else {
        const timer = window.setTimeout(() => {
          onChange(id, nextValue);
          timersRef.current.delete(id);
        }, debounceMs);
        timersRef.current.set(id, timer);
      }
    },
    [debounceMs, onChange]
  );

  React.useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  const handleReset = React.useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current.clear();
    setLocalValues({});
    onReset();
  }, [onReset]);

  const fields = React.useMemo(
    () => mapDataViewFilterDefinitionsToReuiFields(definitions),
    [definitions]
  );

  const reuiFilters = React.useMemo(
    () => mapFilterValuesToReuiFilters(localValues, definitions),
    [localValues, definitions]
  );

  const defMap = React.useMemo(
    () => new Map(definitions.map((d) => [d.id, d])),
    [definitions]
  );

  const handleReuiChange = React.useCallback(
    (nextFilters: Filter[]) => {
      const currentKeys = new Set(
        Object.entries(localValues)
          .filter(([, v]) => v !== undefined && v !== null && v !== "")
          .map(([k]) => k)
      );
      const newKeys = new Set(nextFilters.map((f) => f.field));

      // Remove deleted filters (immediate)
      for (const key of currentKeys) {
        if (!newKeys.has(key)) {
          triggerChange(key, undefined, true);
        }
      }

      // Update or add filters
      for (const filter of nextFilters) {
        const def = defMap.get(filter.field);
        if (!def) continue;

        let nextVal: DataViewFilterValue | undefined;
        if (filter.operator === "empty") {
          nextVal = "";
        } else if (filter.operator === "not_empty") {
          nextVal = "__not_empty__";
        } else if (filter.values.length === 0) {
          nextVal = undefined;
        } else if (def.type === "boolean") {
          nextVal = filter.values[0] === "true";
        } else if (
          def.type === "multi-select" ||
          filter.operator === "is_any_of" ||
          filter.operator === "includes_all"
        ) {
          nextVal = filter.values as string[];
        } else if (def.type === "number") {
          const num = Number(filter.values[0]);
          nextVal = Number.isFinite(num) ? num : undefined;
        } else if (def.type === "date-range" || def.type === "number-range") {
          const from = filter.values[0] as string | number | undefined;
          const to = filter.values[1] as string | number | undefined;
          nextVal = {
            ...(from !== undefined ? { from } : {}),
            ...(to !== undefined ? { to } : {}),
          };
        } else {
          nextVal = filter.values[0] as string;
        }

        const currentVal = localValues[filter.field];
        const isChanged = JSON.stringify(currentVal) !== JSON.stringify(nextVal);
        if (isChanged) {
          triggerChange(filter.field, nextVal, false);
        }
      }
    },
    [localValues, defMap, triggerChange]
  );

  if (definitions.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Filters
        filters={reuiFilters}
        fields={fields}
        onChange={handleReuiChange}
        {...(className !== undefined ? { className } : {})}
        {...(variant !== undefined ? { variant } : {})}
        {...(size !== undefined ? { size } : {})}
        {...(enableShortcut !== undefined ? { enableShortcut } : {})}
        {...(shortcutKey !== undefined ? { shortcutKey } : {})}
        {...(shortcutLabel !== undefined ? { shortcutLabel } : {})}
        {...(trigger !== undefined ? { trigger } : {})}
        debounceMs={debounceMs}
      />

      {reuiFilters.length > 0 && (
        <Button
          type="button"
          variant="ghost"
          size={size === "sm" ? "sm" : "default"}
          onClick={handleReset}
          className="h-8 gap-1 px-2 text-muted-foreground hover:text-foreground"
        >
          <FilterX className="h-3.5 w-3.5" />
          <span>Clear</span>
        </Button>
      )}
    </div>
  );
}
