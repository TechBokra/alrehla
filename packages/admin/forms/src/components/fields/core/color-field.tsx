import type { ChangeEvent } from "react";
import { Input } from "@eng-mohamedelsayed/admin-ui/components/ui/input";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";

export interface ColorFieldProps {
  id?: string | undefined;
  value?: string | undefined;
  onChange?: ((val: string) => void) | undefined;
  onBlur?: (() => void) | undefined;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  className?: string | undefined;
}

export function ColorField({
  id,
  value,
  onChange,
  onBlur,
  placeholder = "#000000",
  disabled,
  readOnly,
  className,
}: ColorFieldProps) {
  const currentHex = value || "#000000";

  return (
    <div className="flex items-center gap-2 w-full ltr-input" dir="ltr">
      <div className="relative flex items-center justify-center h-9 w-9 rounded-md border border-input p-0.5 overflow-hidden shrink-0 shadow-2xs cursor-pointer">
        <input
          type="color"
          value={currentHex.startsWith("#") && currentHex.length === 7 ? currentHex : "#000000"}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={Boolean(disabled || readOnly)}
          className="absolute inset-[-10px] w-[200%] h-[200%] cursor-pointer border-0 p-0"
        />
      </div>
      <Input
        id={id}
        type="text"
        value={value ?? ""}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        maxLength={7}
        className={cn("font-mono uppercase", className)}
      />
    </div>
  );
}
