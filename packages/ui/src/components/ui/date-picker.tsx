"use client";

import * as React from "react";
import {
  format,
  isAfter,
  isBefore,
  isValid,
  parse,
} from "date-fns";
import { ar } from "date-fns/locale/ar";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

const STORAGE_FORMAT = "yyyy-MM-dd";
const DISPLAY_FORMAT = "dd/MM/yyyy";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export interface DatePickerProps {
  /** Backend-compatible date value. The component emits YYYY-MM-DD. */
  value?: string | Date;
  onChange?: (dateString: string) => void;
  max?: string;
  min?: string;
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

const normalizeDigits = (value: string) =>
  value.replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)));

const parseStoredDate = (value?: string | Date): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return isValid(value) ? value : undefined;

  const normalized = normalizeDigits(value.trim());
  const parsed = parse(normalized, STORAGE_FORMAT, new Date());
  if (!isValid(parsed) || format(parsed, STORAGE_FORMAT) !== normalized) return undefined;
  return parsed;
};

const parseManualDate = (value: string): Date | undefined => {
  const normalized = normalizeDigits(value.trim());
  if (!normalized) return undefined;

  const parts = normalized.split(/[\/.-]/).filter(Boolean);
  if (parts.length !== 3 || parts.some((part) => !/^\d+$/.test(part))) return undefined;

  const [first, second, third] = parts;
  const [year, month, day] = first.length === 4
    ? [first, second, third]
    : [third, second, first];
  if (year.length !== 4 || month.length > 2 || day.length > 2) return undefined;

  const parsed = parse(
    `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
    STORAGE_FORMAT,
    new Date(),
  );

  if (!isValid(parsed)) return undefined;

  const normalizedValue = format(parsed, STORAGE_FORMAT);
  if (
    normalizedValue !==
    `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  ) {
    return undefined;
  }

  return parsed;
};

const isWithinBounds = (date: Date, minDate?: Date, maxDate?: Date) => {
  if (minDate && isBefore(date, minDate)) return false;
  if (maxDate && isAfter(date, maxDate)) return false;
  return true;
};

export function DatePicker({
  value,
  onChange,
  max,
  min,
  fromYear,
  toYear,
  placeholder = "اختر التاريخ",
  disabled,
  required,
  className,
  id,
  name,
  onBlur,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [manualValue, setManualValue] = React.useState("");
  const [manualError, setManualError] = React.useState<string | null>(null);

  const selectedDate = React.useMemo(() => parseStoredDate(value), [value]);
  const maxDate = React.useMemo(() => parseStoredDate(max), [max]);
  const minDate = React.useMemo(() => parseStoredDate(min), [min]);

  const currentYear = new Date().getFullYear();
  const calendarFromYear = Math.min(
    fromYear ?? currentYear - 100,
    minDate?.getFullYear() ?? currentYear - 100,
    selectedDate?.getFullYear() ?? currentYear - 100,
  );
  const calendarToYear = Math.max(
    toYear ?? currentYear + 10,
    maxDate?.getFullYear() ?? currentYear + 10,
    selectedDate?.getFullYear() ?? currentYear + 10,
  );

  React.useEffect(() => {
    setManualValue(selectedDate ? format(selectedDate, DISPLAY_FORMAT) : "");
    setManualError(null);
  }, [selectedDate]);

  const emitDate = React.useCallback(
    (date: Date | undefined) => {
      onChange?.(date ? format(date, STORAGE_FORMAT) : "");
    },
    [onChange],
  );

  const commitManualValue = React.useCallback(() => {
    if (!manualValue.trim()) {
      setManualError(null);
      emitDate(undefined);
      onBlur?.();
      return true;
    }

    const date = parseManualDate(manualValue);
    if (!date) {
      setManualError("أدخل تاريخًا صحيحًا بصيغة يوم/شهر/سنة.");
      return false;
    }

    if (!isWithinBounds(date, minDate, maxDate)) {
      setManualError("التاريخ خارج النطاق المسموح.");
      return false;
    }

    setManualValue(format(date, DISPLAY_FORMAT));
    setManualError(null);
    emitDate(date);
    onBlur?.();
    return true;
  }, [emitDate, manualValue, maxDate, minDate, onBlur]);

  const handleSelect = (date: Date | undefined) => {
    if (!date || !isWithinBounds(date, minDate, maxDate)) return;
    setManualValue(format(date, DISPLAY_FORMAT));
    setManualError(null);
    emitDate(date);
    setOpen(false);
    onBlur?.();
  };

  const storedValue = selectedDate ? format(selectedDate, STORAGE_FORMAT) : "";
  const calendarStartMonth = new Date(calendarFromYear, 0, 1);
  const calendarEndMonth = new Date(calendarToYear, 11, 31);

  return (
    <>
      {name && <input type="hidden" name={name} value={storedValue} />}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-required={required}
            aria-invalid={Boolean(manualError)}
            aria-haspopup="dialog"
            className={cn(
              "h-10 w-full justify-start bg-background px-3 py-2 text-right font-normal",
              !selectedDate && "text-muted-foreground",
              manualError && "border-destructive ring-destructive/20",
              className,
            )}
          >
            <CalendarIcon className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
            {selectedDate ? (
              <span dir="ltr">{format(selectedDate, DISPLAY_FORMAT)}</span>
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="z-50 w-auto max-w-[calc(100vw-2rem)] p-0" align="start">
          <div className="space-y-3 p-3" dir="rtl">
            <div className="space-y-1.5">
              <label htmlFor={`${id || "date"}-manual`} className="text-xs font-semibold text-foreground">
                إدخال التاريخ يدويًا
              </label>
              <input
                id={`${id || "date"}-manual`}
                type="text"
                inputMode="numeric"
                dir="ltr"
                autoComplete="off"
                value={manualValue}
                onChange={(event) => {
                  setManualValue(event.target.value);
                  if (manualError) setManualError(null);
                }}
                onBlur={commitManualValue}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (commitManualValue()) setOpen(false);
                  }
                  if (event.key === "Escape") setOpen(false);
                }}
                placeholder="يوم/شهر/سنة"
                className={cn(
                  "h-9 w-full rounded-md border bg-background px-3 text-center text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  manualError && "border-destructive focus-visible:ring-destructive",
                )}
              />
              <p className="text-[11px] text-muted-foreground">مثال: 15/08/2015 أو 2015-08-15</p>
              {manualError && <p className="text-xs font-medium text-destructive">{manualError}</p>}
            </div>

            <Calendar
              mode="single"
              selected={selectedDate}
              defaultMonth={selectedDate || maxDate || new Date()}
              captionLayout="dropdown"
              startMonth={calendarStartMonth}
              endMonth={calendarEndMonth}
              locale={ar}
              dir="rtl"
              onSelect={handleSelect}
              disabled={(date) => !isWithinBounds(date, minDate, maxDate)}
            />
          </div>
        </PopoverContent>
      </Popover>
      {manualError && <p className="mt-1 text-xs font-medium text-destructive">{manualError}</p>}
    </>
  );
}
