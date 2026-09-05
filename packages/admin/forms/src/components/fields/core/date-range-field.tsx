"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";
import { Button } from "@eng-mohamedelsayed/admin-ui/components/ui/button";
import { Calendar } from "@eng-mohamedelsayed/admin-ui/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@eng-mohamedelsayed/admin-ui/components/ui/popover";
import type { DateRange } from "react-day-picker";

export interface DateRangeValue {
  from?: Date | undefined;
  to?: Date | undefined;
}

export interface DateRangeFieldProps {
  id?: string | undefined;
  value?: DateRangeValue | undefined;
  onChange?: ((range: DateRangeValue | undefined) => void) | undefined;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  className?: string | undefined;
}

export function DateRangeField({
  id,
  value,
  onChange,
  placeholder = "Select date range...",
  disabled,
  readOnly,
  className,
}: DateRangeFieldProps) {
  const [open, setOpen] = React.useState(false);

  const selectedRange: DateRange | undefined = React.useMemo(() => {
    if (!value?.from && !value?.to) return undefined;
    return {
      from: value?.from,
      to: value?.to,
    };
  }, [value]);

  const handleSelect = (range: DateRange | undefined) => {
    if (disabled || readOnly) return;
    onChange?.({
      from: range?.from,
      to: range?.to,
    });
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || readOnly) return;
    onChange?.(undefined);
  };

  const formattedText = React.useMemo(() => {
    const fromDate = value?.from;
    const toDate = value?.to;
    if (!fromDate) return placeholder;
    if (fromDate && !toDate) return format(fromDate, "LLL dd, yyyy");
    if (fromDate && toDate) return `${format(fromDate, "LLL dd, yyyy")} - ${format(toDate, "LLL dd, yyyy")}`;
    return placeholder;
  }, [value, placeholder]);

  return (
    <div className="flex w-full items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-between text-left font-normal h-9",
              !value?.from && "text-muted-foreground",
              className
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <CalendarIcon className="h-4 w-4 shrink-0 opacity-70" />
              <span className="truncate">{formattedText}</span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            {...(value?.from ? { defaultMonth: value.from } : {})}
            selected={selectedRange}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
      {value?.from && !(disabled || readOnly) && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={handleClear}
          className="h-5 w-5 shrink-0 p-0 text-muted-foreground hover:text-foreground"
          title="Clear date range"
          aria-label="Clear date range"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
