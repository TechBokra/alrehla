"use client";

import * as React from "react";
import { format, isValid } from "date-fns";
import { Clock } from "lucide-react";

import { cn } from "../../lib/utils";
import { DatePicker } from "./date-picker";

export interface DateTimePickerProps {
  value?: string | Date;
  onChange?: (dateTimeString: string) => void;
  min?: string | Date;
  max?: string | Date;
  fromYear?: number;
  toYear?: number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  name?: string;
  onBlur?: () => void;
}

const getLocalParts = (value?: string | Date) => {
  if (!value) return { date: "", time: "00:00" };
  const parsed = value instanceof Date ? value : new Date(value);
  if (!isValid(parsed)) return { date: "", time: "00:00" };

  return {
    date: format(parsed, "yyyy-MM-dd"),
    time: format(parsed, "HH:mm"),
  };
};

const getDatePart = (value?: string | Date) => getLocalParts(value).date || undefined;

export function DateTimePicker({
  value,
  onChange,
  min,
  max,
  fromYear,
  toYear,
  placeholder = "اختر التاريخ",
  disabled,
  required,
  className,
  id,
  name,
  onBlur,
}: DateTimePickerProps) {
  const initialParts = React.useMemo(() => getLocalParts(value), [value]);
  const [dateValue, setDateValue] = React.useState(initialParts.date);
  const [timeValue, setTimeValue] = React.useState(initialParts.time);

  React.useEffect(() => {
    const nextParts = getLocalParts(value);
    setDateValue(nextParts.date);
    setTimeValue(nextParts.time);
  }, [value]);

  const emit = React.useCallback(
    (nextDate: string, nextTime: string) => {
      if (!nextDate) {
        onChange?.("");
        return;
      }

      const localDateTime = new Date(`${nextDate}T${nextTime || "00:00"}:00`);
      if (!isValid(localDateTime)) return;
      onChange?.(localDateTime.toISOString());
    },
    [onChange],
  );

  const serializedValue = React.useMemo(() => {
    if (!dateValue) return "";
    const localDateTime = new Date(`${dateValue}T${timeValue || "00:00"}:00`);
    return isValid(localDateTime) ? localDateTime.toISOString() : "";
  }, [dateValue, timeValue]);

  return (
    <div className={cn("grid grid-cols-[minmax(0,1fr)_8rem] gap-2", className)}>
      <DatePicker
        id={id}
        value={dateValue}
        min={getDatePart(min)}
        max={getDatePart(max)}
        fromYear={fromYear}
        toYear={toYear}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        onChange={(nextDate) => {
          setDateValue(nextDate);
          emit(nextDate, timeValue);
        }}
        onBlur={onBlur}
      />
      <label className="relative block">
        <span className="sr-only">الوقت</span>
        <Clock className="pointer-events-none absolute right-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id={id ? `${id}-time` : undefined}
          type="time"
          value={timeValue}
          onChange={(event) => {
            const nextTime = event.target.value;
            setTimeValue(nextTime);
            emit(dateValue, nextTime);
          }}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          className="h-10 w-full rounded-md border border-input bg-background px-3 pr-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      {name && <input type="hidden" name={name} value={serializedValue} />}
    </div>
  );
}
