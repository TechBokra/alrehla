import { useState } from "react";
import type { KeyboardEvent, ChangeEvent } from "react";
import { Badge } from "@eng-mohamedelsayed/admin-ui/components/ui/badge";
import { Input } from "@eng-mohamedelsayed/admin-ui/components/ui/input";
import { X } from "lucide-react";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";

export interface TagInputProps {
  id?: string | undefined;
  value?: string[] | undefined;
  onChange?: ((tags: string[]) => void) | undefined;
  onBlur?: (() => void) | undefined;
  placeholder?: string | undefined;
  maxTags?: number | undefined;
  delimiter?: string | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  className?: string | undefined;
}

export function TagInput({
  id,
  value = [],
  onChange,
  onBlur,
  placeholder = "Add tag and press Enter...",
  maxTags,
  delimiter = ",",
  disabled,
  readOnly,
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addTag = (raw: string) => {
    const trimmed = raw.trim().toLowerCase();
    if (!trimmed) return;
    if (value.includes(trimmed)) {
      setInputValue("");
      return;
    }
    if (maxTags && value.length >= maxTags) return;

    const updated = [...value, trimmed];
    onChange?.(updated);
    setInputValue("");
  };

  const removeTag = (tagToRemove: string) => {
    if (disabled || readOnly) return;
    const updated = value.filter((t) => t !== tagToRemove);
    onChange?.(updated);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === delimiter) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      const lastTag = value[value.length - 1];
      if (lastTag) removeTag(lastTag);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 p-2 rounded-md border bg-card min-h-10 focus-within:ring-1 focus-within:ring-ring",
        className
      )}
    >
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1 pe-1 text-xs font-medium">
          <span>{tag}</span>
          {!disabled && !readOnly && (
            <span
              role="button"
              tabIndex={0}
              onClick={() => removeTag(tag)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") removeTag(tag);
              }}
              className="rounded-full hover:bg-muted-foreground/20 p-0.5 cursor-pointer"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </Badge>
      ))}

      {(!maxTags || value.length < maxTags) && !disabled && !readOnly && (
        <Input
          id={id}
          type="text"
          value={inputValue}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputValue) addTag(inputValue);
            onBlur?.();
          }}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 border-0 shadow-none focus-visible:ring-0 h-6 text-xs p-0 min-w-[120px]"
        />
      )}
    </div>
  );
}
