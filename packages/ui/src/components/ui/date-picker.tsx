"use client";

import * as React from "react";
import { format, parse } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";

export interface DatePickerProps {
  value?: string | Date;
  onChange?: (dateString: string) => void;
  max?: string;
  min?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  onBlur?: () => void;
}

export function DatePicker({
  value,
  onChange,
  max,
  min,
  placeholder = "اختر التاريخ",
  disabled,
  className,
  id,
  name,
  onBlur,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    try {
      const parsed = parse(value, "yyyy-MM-dd", new Date());
      return isNaN(parsed.getTime()) ? undefined : parsed;
    } catch {
      return undefined;
    }
  }, [value]);

  const maxDate = React.useMemo(() => {
    if (!max) return undefined;
    try {
      return parse(max, "yyyy-MM-dd", new Date());
    } catch {
      return undefined;
    }
  }, [max]);

  const minDate = React.useMemo(() => {
    if (!min) return undefined;
    try {
      return parse(min, "yyyy-MM-dd", new Date());
    } catch {
      return undefined;
    }
  }, [min]);

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      onChange?.("");
    } else {
      const formatted = format(date, "yyyy-MM-dd");
      onChange?.(formatted);
    }
    setOpen(false);
    onBlur?.();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          name={name}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-right font-normal h-10 px-3 py-2 bg-background border-input",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
          {selectedDate ? (
            format(selectedDate, "yyyy-MM-dd")
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-50" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          disabled={(date) => {
            if (maxDate && date > maxDate) return true;
            if (minDate && date < minDate) return true;
            return false;
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
