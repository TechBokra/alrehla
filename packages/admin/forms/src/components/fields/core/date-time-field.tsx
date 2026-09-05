import { useState } from "react";
import { format, parseISO, isValid, setHours, setMinutes } from "date-fns";
import { Button } from "@eng-mohamedelsayed/admin-ui/components/ui/button";
import { Calendar } from "@eng-mohamedelsayed/admin-ui/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@eng-mohamedelsayed/admin-ui/components/ui/popover";
import { Input } from "@eng-mohamedelsayed/admin-ui/components/ui/input";
import { CalendarIcon, Clock, X } from "lucide-react";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";

export interface DateTimeFieldProps {
  id?: string | undefined;
  value?: Date | string | undefined;
  onChange?: ((val: Date | string | undefined) => void) | undefined;
  onBlur?: (() => void) | undefined;
  placeholder?: string | undefined;
  minDate?: Date | undefined;
  maxDate?: Date | undefined;
  valueFormat?: "date" | "iso" | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  className?: string | undefined;
}

export function DateTimeField({
  id,
  value,
  onChange,
  onBlur,
  placeholder = "Pick date & time",
  minDate,
  maxDate,
  valueFormat = "iso",
  disabled,
  readOnly,
  className,
}: DateTimeFieldProps) {
  const [open, setOpen] = useState(false);

  const parseDateValue = (raw: Date | string | undefined): Date | undefined => {
    if (!raw) return undefined;
    if (raw instanceof Date) return isValid(raw) ? raw : undefined;
    const parsed = parseISO(raw);
    return isValid(parsed) ? parsed : undefined;
  };

  const formatOutput = (d: Date | undefined): Date | string | undefined => {
    if (!d) return undefined;
    if (valueFormat === "iso") return d.toISOString();
    return d;
  };

  const selectedDate = parseDateValue(value);
  const timeString = selectedDate ? format(selectedDate, "HH:mm") : "12:00";

  const handleTimeChange = (timeRaw: string) => {
    if (!timeRaw) return;
    const [h, m] = timeRaw.split(":").map(Number);
    const base = selectedDate || new Date();
    const updated = setMinutes(setHours(base, h || 0), m || 0);
    onChange?.(formatOutput(updated));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={Boolean(disabled || readOnly)}
          onBlur={onBlur}
          className={cn(
            "w-full justify-start text-start font-normal px-3 data-[empty=true]:text-muted-foreground",
            className
          )}
          data-empty={!selectedDate}
        >
          <CalendarIcon className="me-2 h-4 w-4 opacity-50 shrink-0" />
          <span className="truncate flex-1">
            {selectedDate ? format(selectedDate, "PPP 'at' p") : placeholder}
          </span>
          {selectedDate && !disabled && !readOnly && (
            <X
              className="h-3.5 w-3.5 opacity-50 hover:opacity-100 ms-2"
              onClick={(e) => {
                e.stopPropagation();
                onChange?.(undefined);
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 space-y-3" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(d?: Date) => {
            if (!d) {
              onChange?.(undefined);
              return;
            }
            const [h, m] = timeString.split(":").map(Number);
            const updated = setMinutes(setHours(d, h || 0), m || 0);
            onChange?.(formatOutput(updated));
          }}
          disabled={(d: Date) => {
            if (minDate && d < minDate) return true;
            if (maxDate && d > maxDate) return true;
            return false;
          }}
        />
        <div className="flex items-center gap-2 pt-2 border-t">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium">Time:</span>
          <Input
            type="time"
            value={timeString}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTimeChange(e.target.value)}
            className="h-8 text-xs font-mono w-[120px]"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
