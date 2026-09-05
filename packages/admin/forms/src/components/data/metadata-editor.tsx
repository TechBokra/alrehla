"use client";

import * as React from "react";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";
import { FieldSet, FieldLegend, FieldDescription } from "@eng-mohamedelsayed/admin-ui/components/ui/field";
import { KeyValueField, type KeyValuePair } from "./key-value-field";
import { Database } from "lucide-react";

export type MetadataValue = Record<string, unknown>;

export interface MetadataEditorProps<
  TValue extends MetadataValue = MetadataValue,
> {
  id?: string | undefined;
  value?: TValue | undefined;
  onChange?: ((meta: TValue) => void) | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  className?: string | undefined;
}

const UNSAFE_METADATA_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function isSafeMetadataKey(key: string) {
  return Boolean(key) && !UNSAFE_METADATA_KEYS.has(key);
}

/**
 * The editor is text based, while Medusa metadata can contain any JSON value.
 * Keep strings readable and serialize the other JSON-compatible values so they
 * can round-trip through the input without becoming `[object Object]`.
 */
export function metadataValueToText(value: unknown): string {
  if (typeof value === "string") return value;

  try {
    const serialized = JSON.stringify(value);
    return serialized ?? "";
  } catch {
    return String(value ?? "");
  }
}

/**
 * Plain text remains a string. Valid JSON syntax lets an operator intentionally
 * enter numbers, booleans, null, arrays, objects, or a quoted JSON string.
 */
export function metadataTextToValue(value: string): unknown {
  const normalized = value.trim();
  if (!normalized) return value;

  try {
    return JSON.parse(normalized) as unknown;
  } catch {
    return value;
  }
}

export function MetadataEditor<TValue extends MetadataValue = MetadataValue>({
  id,
  value: controlledValue,
  onChange,
  disabled,
  readOnly,
  className,
}: MetadataEditorProps<TValue>) {
  const value = controlledValue ?? ({} as TValue);
  // A record cannot represent an in-progress empty key, so keep the editor's
  // rows locally while the sanitized record remains the controlled value.
  const externalPairs: KeyValuePair[] = React.useMemo(() => {
    return Object.entries(value).map(([k, v], idx) => ({
      id: `meta_${k}_${idx}`,
      key: k,
      value: metadataValueToText(v),
    }));
  }, [value]);

  const [pairs, setPairs] = React.useState<KeyValuePair[]>(externalPairs);
  const pairValuesRef = React.useRef(new Map<string, unknown>());

  React.useEffect(() => {
    externalPairs.forEach((pair) => {
      pairValuesRef.current.set(pair.id, value[pair.key]);
    });
  }, [externalPairs, value]);

  React.useEffect(() => {
    const localRecord: Record<string, string> = {};
    for (const pair of pairs) {
      const trimmedKey = pair.key.trim();
      if (isSafeMetadataKey(trimmedKey)) {
        localRecord[trimmedKey] = pair.value;
      }
    }

    const externalRecord = Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => isSafeMetadataKey(key))
        .map(([key, metadataValue]) => [
          key,
          metadataValueToText(metadataValue),
        ])
    );
    const externalKeys = Object.keys(externalRecord).sort();
    const localKeys = Object.keys(localRecord).sort();
    const matches =
      externalKeys.length === localKeys.length &&
      externalKeys.every(
        (key, index) =>
          key === localKeys[index] && externalRecord[key] === localRecord[key]
      );

    if (!matches) setPairs(externalPairs);
  }, [externalPairs, pairs, value]);

  const handlePairsChange = (newPairs: KeyValuePair[]) => {
    if (disabled || readOnly) return;
    setPairs(newPairs);
    const record: MetadataValue = {};
    const nextPairValues = new Map<string, unknown>();
    for (const pair of newPairs) {
      const trimmedKey = pair.key.trim();
      // Prototype pollution prevention
      if (isSafeMetadataKey(trimmedKey)) {
        const hasCachedValue = pairValuesRef.current.has(pair.id);
        const hasExistingValue = Object.prototype.hasOwnProperty.call(
          value,
          trimmedKey
        );
        const previousValue = hasCachedValue
          ? pairValuesRef.current.get(pair.id)
          : value[trimmedKey];
        const nextValue =
          (hasCachedValue || hasExistingValue) &&
          metadataValueToText(previousValue) === pair.value
            ? previousValue
            : metadataTextToValue(pair.value);

        record[trimmedKey] = nextValue;
        nextPairValues.set(pair.id, nextValue);
      }
    }
    pairValuesRef.current = nextPairValues;
    onChange?.(record as TValue);
  };

  return (
    <FieldSet
      className={cn(
        "space-y-3 rounded-lg border p-4 bg-card shadow-2xs",
        className
      )}
    >
      <div>
        <FieldLegend className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          Custom Metadata
        </FieldLegend>
        <FieldDescription>
          Store key-value metadata for integrations, external ERP mappings, or
          custom attributes. Values can be text or valid JSON.
        </FieldDescription>
      </div>

      <KeyValueField
        id={id}
        value={pairs}
        onChange={handlePairsChange}
        keyPlaceholder="Property key (e.g. erp_id)"
        valuePlaceholder="Property value"
        disabled={disabled}
        readOnly={readOnly}
      />
    </FieldSet>
  );
}
