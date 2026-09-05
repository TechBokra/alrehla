"use client";

import * as React from "react";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
} from "@eng-mohamedelsayed/admin-ui/components/ui/input-group";
import {
  Lock,
  Unlock,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@eng-mohamedelsayed/admin-ui/components/ui/badge";

export type SlugAvailability =
  "idle" | "checking" | "available" | "unavailable";

export interface SlugFieldProps {
  id?: string | undefined;
  value?: string | undefined;
  sourceValue?: string | undefined;
  onChange?: ((val: string) => void) | undefined;
  prefix?: string | undefined;
  placeholder?: string | undefined;
  availability?: SlugAvailability | undefined;
  onCheckAvailability?:
    | ((slug: string) => Promise<boolean> | boolean)
    | undefined;
  checkOnBlur?: boolean | undefined;
  initialSlug?: string | undefined;
  onBlur?: React.FocusEventHandler<HTMLInputElement> | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  className?: string | undefined;
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

export function SlugField({
  id,
  value = "",
  sourceValue,
  onChange,
  prefix = "/products/",
  placeholder = "url-slug-here",
  availability: controlledAvailability,
  onCheckAvailability,
  checkOnBlur = true,
  initialSlug,
  onBlur,
  disabled,
  readOnly,
  className,
}: SlugFieldProps) {
  const [locked, setLocked] = React.useState(true);
  const [copied, setCopied] = React.useState(false);
  const [internalAvailability, setInternalAvailability] =
    React.useState<SlugAvailability>("idle");

  const availability = controlledAvailability ?? internalAvailability;

  // Auto-generate from source when locked and sourceValue changes
  React.useEffect(() => {
    if (locked && sourceValue) {
      const generated = slugify(sourceValue);
      if (generated !== value) {
        onChange?.(generated);
        setInternalAvailability("idle");
      }
    }
  }, [sourceValue, locked, value, onChange]);

  const handleManualChange = (raw: string) => {
    if (disabled || readOnly) return;
    const formatted = slugify(raw);
    onChange?.(formatted);
    setInternalAvailability("idle");
  };

  const performAvailabilityCheck = React.useCallback(
    async (slugToCheck: string) => {
      const trimmed = slugToCheck.trim();
      if (!trimmed || !onCheckAvailability) {
        setInternalAvailability("idle");
        return;
      }
      if (initialSlug && trimmed === initialSlug) {
        setInternalAvailability("available");
        return;
      }
      setInternalAvailability("checking");
      try {
        const isAvailable = await onCheckAvailability(trimmed);
        setInternalAvailability(isAvailable ? "available" : "unavailable");
      } catch {
        setInternalAvailability("idle");
      }
    },
    [onCheckAvailability, initialSlug]
  );

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onBlur?.(e);
    if (checkOnBlur && onCheckAvailability && value) {
      void performAvailabilityCheck(value);
    }
  };

  const handleCopy = () => {
    const fullPath = `${prefix}${value}`;
    navigator.clipboard.writeText(fullPath);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <InputGroup className="w-full ltr-input" dir="ltr">
        {prefix && (
          <InputGroupAddon align="inline-start">
            <InputGroupText className="font-mono text-xs text-muted-foreground select-none">
              {prefix}
            </InputGroupText>
          </InputGroupAddon>
        )}

        <InputGroupInput
          id={id}
          value={value}
          onChange={(e) => handleManualChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled || (locked && !!sourceValue)}
          readOnly={readOnly}
          className="font-mono text-sm"
        />

        <InputGroupAddon
          align="inline-end"
          className="flex items-center space-x-1"
        >
          {sourceValue && !(disabled || readOnly) && (
            <InputGroupButton
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setLocked(!locked)}
              title={
                locked
                  ? "Unlock manual slug editing"
                  : "Lock to auto-generate from title"
              }
            >
              {locked ? (
                <Lock className="h-3.5 w-3.5" />
              ) : (
                <Unlock className="h-3.5 w-3.5" />
              )}
            </InputGroupButton>
          )}

          {onCheckAvailability && value && !(disabled || readOnly) && (
            <InputGroupButton
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => void performAvailabilityCheck(value)}
              disabled={availability === "checking"}
              title="Check slug availability"
            >
              <RefreshCw
                className={cn(
                  "h-3.5 w-3.5",
                  availability === "checking" && "animate-spin text-primary"
                )}
              />
            </InputGroupButton>
          )}

          <InputGroupButton
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={handleCopy}
            disabled={!value}
            title="Copy full URL slug"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>

      {/* Availability Status Indicator */}
      {availability !== "idle" && (
        <div className="flex items-center gap-1.5 text-xs">
          {availability === "checking" && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Checking availability...
            </span>
          )}
          {availability === "available" && (
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle2 className="h-3 w-3" />
              Slug is available
            </span>
          )}
          {availability === "unavailable" && (
            <span className="flex items-center gap-1 text-destructive font-medium">
              <AlertCircle className="h-3 w-3" />
              Slug is already in use
            </span>
          )}
        </div>
      )}
    </div>
  );
}
