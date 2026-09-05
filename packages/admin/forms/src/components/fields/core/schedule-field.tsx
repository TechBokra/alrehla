"use client";

import * as React from "react";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";
import { FieldSet, FieldLegend, FieldDescription, Field, FieldLabel } from "@eng-mohamedelsayed/admin-ui/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@eng-mohamedelsayed/admin-ui/components/ui/select";
import { DateTimeField } from "./date-time-field";
import { Clock, Globe } from "lucide-react";

export interface ScheduleValue {
  startsAt?: Date | string | undefined;
  endsAt?: Date | string | undefined;
  timezone?: string | undefined;
}

export interface ScheduleFieldProps {
  id?: string | undefined;
  value?: ScheduleValue | undefined;
  onChange?: ((val: ScheduleValue) => void) | undefined;
  timezones?: Array<{ value: string; label: string }> | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  className?: string | undefined;
}

const DEFAULT_TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "Africa/Cairo", label: "Africa/Cairo (EET, GMT+2/3)" },
  { value: "Asia/Riyadh", label: "Asia/Riyadh (AST, GMT+3)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST, GMT+4)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "America/New_York", label: "America/New_York (EST/EDT)" },
];

export function ScheduleField({
  id,
  value,
  onChange,
  timezones = DEFAULT_TIMEZONES,
  disabled,
  readOnly,
  className,
}: ScheduleFieldProps) {
  const safeValue: ScheduleValue = {
    startsAt: value?.startsAt,
    endsAt: value?.endsAt,
    timezone: value?.timezone || "Africa/Cairo",
  };

  const handleStartsAtChange = (val: Date | string | undefined) => {
    if (disabled || readOnly) return;
    onChange?.({
      ...safeValue,
      startsAt: val,
    });
  };

  const handleEndsAtChange = (val: Date | string | undefined) => {
    if (disabled || readOnly) return;
    onChange?.({
      ...safeValue,
      endsAt: val,
    });
  };

  const handleTimezoneChange = (tz: string) => {
    if (disabled || readOnly) return;
    onChange?.({
      ...safeValue,
      timezone: tz,
    });
  };

  return (
    <FieldSet className={cn("space-y-4 rounded-lg border p-4 bg-card shadow-2xs", className)}>
      <div>
        <FieldLegend className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Schedule Settings
        </FieldLegend>
        <FieldDescription>
          Specify publication start &amp; end date-times along with timezone context.
        </FieldDescription>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={id ? `${id}-start` : undefined}>Starts At</FieldLabel>
          <DateTimeField
            id={id ? `${id}-start` : undefined}
            value={safeValue.startsAt}
            onChange={handleStartsAtChange}
            placeholder="Select start date & time"
            disabled={disabled}
            readOnly={readOnly}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={id ? `${id}-end` : undefined}>Ends At</FieldLabel>
          <DateTimeField
            id={id ? `${id}-end` : undefined}
            value={safeValue.endsAt}
            onChange={handleEndsAtChange}
            placeholder="Select end date & time"
            disabled={disabled}
            readOnly={readOnly}
          />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor={id ? `${id}-tz` : undefined} className="flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          Timezone
        </FieldLabel>
        <Select
          {...(safeValue.timezone ? { value: safeValue.timezone } : {})}
          onValueChange={handleTimezoneChange}
          {...(disabled || readOnly ? { disabled: true } : {})}
        >
          <SelectTrigger id={id ? `${id}-tz` : undefined} className="w-full">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {timezones.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </FieldSet>
  );
}
