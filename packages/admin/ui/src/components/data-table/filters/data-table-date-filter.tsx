"use client";

import * as React from "react";
import { CalendarIcon, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";
import { Calendar } from "../../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import type { DataViewRangeValue } from "@eng-mohamedelsayed/admin-core/data-view";

interface DataTableDateFilterProps {
  title?: string;
  value?: DataViewRangeValue | string | undefined;
  onChange: (value: DataViewRangeValue | undefined) => void;
}

function formatDate(iso: string | number | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toDateRange(
  value: DataViewRangeValue | string | undefined
): DateRange | undefined {
  if (!value) return undefined;
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : { from: d, to: d };
  }
  const from = value.from ? new Date(value.from) : undefined;
  const to = value.to ? new Date(value.to) : undefined;

  const validFrom = from && !Number.isNaN(from.getTime()) ? from : undefined;
  const validTo = to && !Number.isNaN(to.getTime()) ? to : undefined;

  if (!validFrom && !validTo) return undefined;
  return { from: validFrom, to: validTo };
}

export function DataTableDateFilter({
  title = "Date",
  value,
  onChange,
}: DataTableDateFilterProps) {
  const selectedRange = toDateRange(value);
  const hasValue = Boolean(selectedRange?.from || selectedRange?.to);

  const handleSelect = (range: DateRange | undefined) => {
    if (!range || (!range.from && !range.to)) {
      onChange(undefined);
      return;
    }

    const fromIso = range.from ? range.from.toISOString() : undefined;
    const toIso = range.to ? range.to.toISOString() : undefined;

    onChange({
      ...(fromIso ? { from: fromIso } : {}),
      ...(toIso ? { to: toIso } : {}),
    });
  };

  const labelText = React.useMemo(() => {
    if (!selectedRange?.from) return title;
    if (!selectedRange.to || selectedRange.from.getTime() === selectedRange.to.getTime()) {
      return formatDate(selectedRange.from.toISOString());
    }
    return `${formatDate(selectedRange.from.toISOString())} – ${formatDate(selectedRange.to.toISOString())}`;
  }, [selectedRange, title]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-8 border-dashed gap-2", hasValue && "border-solid bg-accent/50")}
        >
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-normal">{labelText}</span>
          {hasValue && (
            <span
              role="button"
              tabIndex={0}
              className="ml-1 rounded-xs hover:bg-muted p-0.5"
              onClick={(e) => {
                e.stopPropagation();
                onChange(undefined);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  onChange(undefined);
                }
              }}
              aria-label="Clear date filter"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          {...(selectedRange?.from ? { defaultMonth: selectedRange.from } : {})}
          selected={selectedRange}
          onSelect={handleSelect}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
