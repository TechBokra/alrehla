"use client";

import * as React from "react";
import {
  Check,
  ChevronRight,
  ChevronsUpDown,
  CornerDownRight,
  FolderTree,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";
import { Button } from "@eng-mohamedelsayed/admin-ui/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@eng-mohamedelsayed/admin-ui/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@eng-mohamedelsayed/admin-ui/components/ui/popover";

export interface ParentEntity {
  id: string;
  name: string;
  path?: string[] | undefined;
  depth?: number | undefined;
  parentId?: string | null | undefined;
  itemCount?: number | undefined;
  disabled?: boolean | undefined;
}

export interface ParentPickerProps {
  id?: string | undefined;
  value?: string | null | undefined;
  onChange?: ((val: string | undefined, item?: ParentEntity | undefined) => void) | undefined;
  onBlur?: (() => void) | undefined;
  items?: ParentEntity[] | undefined;
  onSearch?: ((query: string) => Promise<ParentEntity[]>) | undefined;
  currentId?: string | null | undefined;
  excludeIds?: string[] | undefined;
  placeholder?: string | undefined;
  rootLabel?: string | undefined;
  searchPlaceholder?: string | undefined;
  emptyText?: string | undefined;
  allowClear?: boolean | undefined;
  allowRoot?: boolean | undefined;
  loading?: boolean | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  className?: string | undefined;
  debounceMs?: number | undefined;
}

export function ParentPicker({
  id,
  value,
  onChange,
  onBlur,
  items: initialItems = [],
  onSearch,
  currentId,
  excludeIds = [],
  placeholder = "Select parent...",
  rootLabel = "No parent (Root level)",
  searchPlaceholder = "Search parents...",
  emptyText = "No parent options found.",
  allowClear = true,
  allowRoot = true,
  loading: externalLoading = false,
  disabled,
  readOnly,
  className,
  debounceMs = 300,
}: ParentPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [items, setItems] = React.useState<ParentEntity[]>(initialItems);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  React.useEffect(() => {
    if (!onSearch) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await onSearch(query);
        setItems(results);
      } catch (err) {
        console.error("Parent search error:", err);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, onSearch, debounceMs]);

  const excludedIdSet = React.useMemo(() => {
    const set = new Set(excludeIds);
    if (currentId) set.add(currentId);
    return set;
  }, [currentId, excludeIds]);

  const filteredItems = React.useMemo(() => {
    return items.map((item) => ({
      ...item,
      disabled: item.disabled || excludedIdSet.has(item.id),
    }));
  }, [items, excludedIdSet]);

  const selectedItem = React.useMemo(() => {
    if (!value) return null;
    return items.find((item) => item.id === value) ?? null;
  }, [items, value]);

  const handleSelect = (nextValue: string | undefined, entity?: ParentEntity) => {
    onChange?.(nextValue, entity);
    setOpen(false);
  };

  const isRootSelected = !value || value === "";

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
          <div className="truncate text-start flex-1 flex items-center gap-1.5">
            {selectedItem ? (
              <div className="flex items-center space-x-1 text-xs truncate">
                {(selectedItem.path || [selectedItem.name]).map((seg, idx, arr) => (
                  <span key={idx} className="flex items-center">
                    {idx > 0 && (
                      <ChevronRight className="h-3 w-3 text-muted-foreground mx-0.5" />
                    )}
                    <span
                      className={
                        idx === arr.length - 1
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {seg}
                    </span>
                  </span>
                ))}
              </div>
            ) : isRootSelected && allowRoot ? (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <FolderTree className="h-3.5 w-3.5" />
                <span>{rootLabel}</span>
              </span>
            ) : (
              <span>{placeholder}</span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 ms-2">
            {loading || externalLoading ? (
              <Loader2 className="h-4 w-4 animate-spin opacity-50" />
            ) : value && allowClear && !disabled && !readOnly ? (
              <X
                className="h-3.5 w-3.5 opacity-50 hover:opacity-100 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(undefined, undefined);
                }}
              />
            ) : (
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            )}
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-full min-w-[280px] p-0" align="start">
        <Command shouldFilter={!onSearch}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {loading || externalLoading ? (
              <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching...</span>
              </div>
            ) : (
              <>
                <CommandEmpty>{emptyText}</CommandEmpty>

                {allowRoot && (
                  <CommandGroup heading="Hierarchy Level">
                    <CommandItem
                      value="__root__"
                      onSelect={() => handleSelect(undefined, undefined)}
                      className="flex items-center justify-between py-1.5 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0",
                            isRootSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <FolderTree className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium">{rootLabel}</span>
                      </div>
                    </CommandItem>
                  </CommandGroup>
                )}

                {allowRoot && filteredItems.length > 0 && <CommandSeparator />}

                {filteredItems.length > 0 && (
                  <CommandGroup heading="Parent Resources">
                    {filteredItems.map((item) => {
                      const isSelected = String(value) === String(item.id);
                      const depth = item.depth ?? (item.path ? Math.max(0, item.path.length - 1) : 0);

                      return (
                        <CommandItem
                          key={item.id}
                          value={item.path ? item.path.join(" / ") : item.name}
                          disabled={item.disabled}
                          onSelect={() => {
                            if (item.disabled) return;
                            handleSelect(item.id, item);
                          }}
                          className={cn(
                            "flex items-center justify-between py-1.5 cursor-pointer",
                            item.disabled && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div
                            className="flex items-center gap-1.5 text-xs truncate flex-1"
                            style={{
                              marginLeft: depth > 0 ? `${depth * 0.75}rem` : undefined,
                            }}
                          >
                            <Check
                              className={cn(
                                "h-4 w-4 shrink-0 me-1",
                                isSelected ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {depth > 0 && (
                              <CornerDownRight className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                            )}
                            <div className="flex items-center space-x-1 truncate">
                              {(item.path || [item.name]).map((seg, idx, arr) => (
                                <span key={idx} className="flex items-center">
                                  {idx > 0 && (
                                    <ChevronRight className="h-3 w-3 text-muted-foreground mx-0.5" />
                                  )}
                                  <span
                                    className={
                                      idx === arr.length - 1
                                        ? "font-medium text-foreground"
                                        : "text-muted-foreground"
                                    }
                                  >
                                    {seg}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>

                          {item.itemCount !== undefined && (
                            <span className="text-[10px] text-muted-foreground ms-2 shrink-0">
                              {item.itemCount} items
                            </span>
                          )}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
