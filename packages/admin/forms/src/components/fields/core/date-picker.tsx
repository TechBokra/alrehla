"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";

import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";
import { Calendar } from "@eng-mohamedelsayed/admin-ui/components/ui/calendar";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@eng-mohamedelsayed/admin-ui/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@eng-mohamedelsayed/admin-ui/components/ui/popover";

export interface DatePickerProps {
  value?: Date | undefined;
  onChange?: ((date?: Date) => void) | undefined;
  className?: string | undefined;
  disabled?: boolean | undefined;
  placeholder?: string | undefined;
  id?: string | undefined;
}

function formatDate(date: Date | undefined) {
  if (!date) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false;
  }
  return !isNaN(date.getTime());
}

export function DatePicker({
  value: date,
  onChange: setDate,
  className,
  disabled,
  placeholder = "Select date...",
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date | undefined>(date);
  const [inputValue, setInputValue] = React.useState(formatDate(date));

  React.useEffect(() => {
    setInputValue(formatDate(date));
    setMonth(date);
  }, [date]);

  return (
    <InputGroup className={cn("w-full", className)}>
      <InputGroupInput
        id={id}
        value={inputValue}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => {
          const newDate = new Date(e.target.value);
          setInputValue(e.target.value);
          if (isValidDate(newDate)) {
            setDate?.(newDate);
            setMonth(newDate);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      />
      <InputGroupAddon align="inline-end">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <InputGroupButton
              id={id ? `${id}-trigger` : undefined}
              variant="ghost"
              size="icon-xs"
              aria-label="Select date"
              disabled={disabled}
              type="button"
            >
              <CalendarIcon className="h-4 w-4" />
              <span className="sr-only">Select date</span>
            </InputGroupButton>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden p-0"
            align="end"
            alignOffset={-8}
            sideOffset={10}
          >
            <Calendar
              mode="single"
              selected={date}
              {...(month ? { month } : {})}
              onMonthChange={setMonth}
              onSelect={(selectedDate) => {
                setDate?.(selectedDate);
                setInputValue(formatDate(selectedDate));
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </InputGroupAddon>
    </InputGroup>
  );
}
