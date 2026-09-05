import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Button } from "@eng-mohamedelsayed/admin-ui/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@eng-mohamedelsayed/admin-ui/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@eng-mohamedelsayed/admin-ui/components/ui/command";
import { Check, ChevronsUpDown, X, Loader2 } from "lucide-react";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";

export interface EntityPickerProps<TEntity> {
  id?: string | undefined;
  items?: TEntity[] | undefined;
  onSearch?: ((query: string) => Promise<TEntity[]>) | undefined;
  getId: (entity: TEntity) => string;
  getLabel: (entity: TEntity) => string;
  renderItem?: ((entity: TEntity, selected: boolean) => ReactNode) | undefined;
  renderSelected?: ((entity: TEntity) => ReactNode) | undefined;
  placeholder?: string | undefined;
  searchPlaceholder?: string | undefined;
  emptyText?: string | undefined;
  loading?: boolean | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  className?: string | undefined;
  debounceMs?: number | undefined;
  value?: string | undefined;
  onChange?: ((val: string | undefined, entity?: TEntity) => void) | undefined;
  onBlur?: (() => void) | undefined;
}

export function EntityPicker<TEntity>({
  id,
  items: initialItems = [],
  onSearch,
  getId,
  getLabel,
  renderItem,
  renderSelected,
  placeholder = "Select item...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  loading: externalLoading = false,
  disabled,
  readOnly,
  className,
  debounceMs = 300,
  value,
  onChange,
  onBlur,
}: EntityPickerProps<TEntity>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<TEntity[]>(initialItems);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    if (!onSearch) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await onSearch(query);
        setItems(results);
      } catch (err) {
        console.error("Entity search error:", err);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, onSearch, debounceMs]);

  const selectedEntity = items.find((item) => getId(item) === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={Boolean(disabled || readOnly)}
          onBlur={onBlur}
          className={cn(
            "w-full justify-between font-normal px-3 h-auto min-h-9 py-1.5",
            !value && "text-muted-foreground",
            className
          )}
        >
          <div className="truncate text-start flex-1">
            {selectedEntity ? (
              renderSelected ? (
                renderSelected(selectedEntity)
              ) : (
                <span className="font-medium text-foreground">{getLabel(selectedEntity)}</span>
              )
            ) : (
              placeholder
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 ms-2">
            {loading || externalLoading ? (
              <Loader2 className="h-4 w-4 animate-spin opacity-50" />
            ) : value && !disabled && !readOnly ? (
              <X
                className="h-3.5 w-3.5 opacity-50 hover:opacity-100 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange?.(undefined, undefined);
                }}
              />
            ) : (
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-[260px] p-0" align="start">
        <Command shouldFilter={!onSearch}>
          <CommandInput placeholder={searchPlaceholder} value={query} onValueChange={setQuery} />
          <CommandList>
            {loading || externalLoading ? (
              <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching...</span>
              </div>
            ) : (
              <>
                <CommandEmpty>{emptyText}</CommandEmpty>
                <CommandGroup>
                  {items.map((item) => {
                    const itemId = getId(item);
                    const isSelected = String(value) === String(itemId);
                    return (
                      <CommandItem
                        key={itemId}
                        value={getLabel(item)}
                        onSelect={() => {
                          const nextVal = isSelected ? undefined : itemId;
                          onChange?.(nextVal, isSelected ? undefined : item);
                          setOpen(false);
                        }}
                      >
                        <Check className={cn("me-2 h-4 w-4 shrink-0", isSelected ? "opacity-100" : "opacity-0")} />
                        {renderItem ? renderItem(item, isSelected) : <span>{getLabel(item)}</span>}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
