"use client";

import * as React from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { DataViewFilterControls } from "../data-table/filters/data-view-filters";
import type { DataViewFilterDefinition, DataViewFilterValue } from "@eng-mohamedelsayed/admin-core/data-view";
import { useResource } from "@eng-mohamedelsayed/admin-core/resource";

export interface ResourceSearchBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Debounce delay for free-text search in milliseconds. Defaults to 300 */
  debounceMs?: number | undefined;
  /** Custom placeholder for search input */
  placeholder?: string | undefined;
  /** Whether to render the advanced filter trigger inside the search bar. Defaults to true */
  showFilters?: boolean | undefined;
  /** Maximum number of filter chips visible before collapsing to "+N more". Defaults to 3 */
  maxVisibleChips?: number | undefined;
}

function formatFilterChipValue(
  def: DataViewFilterDefinition,
  val: DataViewFilterValue
): string {
  if (val === undefined || val === null || val === "") return "";

  if (Array.isArray(val)) {
    if (val.length === 0) return "";
    const firstOption = def.options?.find((o) => String(o.value) === String(val[0]));
    const firstLabel = firstOption ? firstOption.label : String(val[0]);
    if (val.length === 1) return firstLabel;
    return `${firstLabel} (+${val.length - 1})`;
  }

  if (typeof val === "boolean") {
    return val ? "Yes" : "No";
  }

  if (typeof val === "object") {
    const range = val as { from?: string | number; to?: string | number };
    if (range.from !== undefined && range.to !== undefined) {
      return `${range.from} – ${range.to}`;
    }
    if (range.from !== undefined) return `≥ ${range.from}`;
    if (range.to !== undefined) return `≤ ${range.to}`;
    return "";
  }

  const option = def.options?.find((o) => String(o.value) === String(val));
  if (option) return option.label;

  return String(val);
}

export function ResourceSearchBar({
  debounceMs = 300,
  placeholder,
  showFilters = true,
  maxVisibleChips = 3,
  className,
  ...props
}: ResourceSearchBarProps) {
  const { definition, dataView } = useResource();
  const searchConfig = definition.dataView.search;
  const effectiveDebounceMs = searchConfig?.debounceMs ?? debounceMs;
  const filterDefinitions = definition.dataView.filters ?? [];

  const onSearchChange = dataView.onSearchInputChange ?? dataView.onSearchChange;
  const onFilterChange = dataView.onFilterChange;

  const currentSearchValue = dataView.searchInput ?? dataView.state.search ?? "";
  const currentFilters = dataView.state.filters ?? {};

  const [inputValue, setInputValue] = React.useState(currentSearchValue);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Sync external search value changes
  React.useEffect(() => {
    setInputValue(currentSearchValue);
  }, [currentSearchValue]);

  // Clean up debounce timer on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value;
      setInputValue(nextValue);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (onSearchChange) {
        if (effectiveDebounceMs <= 0) {
          onSearchChange(nextValue);
        } else {
          debounceTimerRef.current = setTimeout(() => {
            onSearchChange(nextValue);
          }, effectiveDebounceMs);
        }
      }
    },
    [effectiveDebounceMs, onSearchChange]
  );

  const handleClearSearch = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setInputValue("");
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (onSearchChange) {
        onSearchChange("");
      }
      inputRef.current?.focus();
    },
    [onSearchChange]
  );

  // Extract active filter chips
  const activeChips = React.useMemo(() => {
    const chips: {
      id: string;
      label: string;
      valueText: string;
    }[] = [];

    for (const def of filterDefinitions) {
      const val = currentFilters[def.id];
      if (val !== undefined && val !== null && val !== "") {
        const formatted = formatFilterChipValue(def, val);
        if (formatted) {
          chips.push({
            id: def.id,
            label: def.label,
            valueText: formatted,
          });
        }
      }
    }

    return chips;
  }, [currentFilters, filterDefinitions]);

  const handleRemoveFilter = React.useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (onFilterChange) {
        onFilterChange(id, undefined);
      }
      inputRef.current?.focus();
    },
    [onFilterChange]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && inputValue === "" && activeChips.length > 0) {
        const lastChip = activeChips[activeChips.length - 1];
        if (lastChip && onFilterChange) {
          onFilterChange(lastChip.id, undefined);
        }
      } else if (e.key === "Enter") {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        if (onSearchChange) {
          onSearchChange(inputValue);
        }
      } else if (e.key === "Escape") {
        inputRef.current?.blur();
      }
    },
    [activeChips, inputValue, onFilterChange, onSearchChange]
  );

  const visibleChips = activeChips.slice(0, maxVisibleChips);
  const hiddenCount = activeChips.length - visibleChips.length;

  const defaultPlaceholder =
    placeholder ??
    searchConfig?.placeholder ??
    `Search ${(definition.metadata.pluralLabel ?? definition.metadata.label).toLowerCase()}…`;

  return (
    <div
      {...props}
      onClick={() => inputRef.current?.focus()}
      className={cn(
        "group relative flex flex-wrap sm:flex-nowrap items-center gap-1.5 min-h-[36px] w-full max-w-xl rounded-lg border border-input bg-background px-2.5 py-1 text-sm shadow-2xs transition-all",
        "hover:border-accent focus-within:border-ring focus-within:ring-1 focus-within:ring-ring",
        className
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-muted-foreground select-none pointer-events-none" />

      {/* Active Filter Chips */}
      {visibleChips.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex items-center gap-1 text-xs font-medium bg-muted/80 text-foreground px-2 py-0.5 rounded-md border border-border/60 select-none shrink-0"
        >
          <span className="text-muted-foreground">{chip.label}:</span>
          <span className="font-semibold truncate max-w-[120px]">{chip.valueText}</span>
          <button
            type="button"
            onClick={(e) => handleRemoveFilter(chip.id, e)}
            className="hover:bg-background/80 rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors ml-0.5 focus:outline-none"
            aria-label={`Remove filter for ${chip.label}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      {hiddenCount > 0 && (
        <span className="inline-flex items-center text-xs font-medium bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded-md border border-border/40 select-none shrink-0">
          +{hiddenCount} more
        </span>
      )}

      {/* Free-Text Search Input */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={activeChips.length > 0 ? "Search..." : defaultPlaceholder}
        className="flex-1 min-w-[100px] bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none h-6 py-0 px-1 text-foreground"
        aria-label={searchConfig?.ariaLabel ?? defaultPlaceholder}
      />

      {/* Clear Search Text Button */}
      {inputValue.length > 0 && (
        <button
          type="button"
          onClick={handleClearSearch}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors shrink-0"
          aria-label="Clear search text"
          title="Clear search text"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Advanced Filter Trigger inside search bar */}
      {showFilters && filterDefinitions.length > 0 && onFilterChange && (
        <div className="shrink-0 pl-1 border-l border-border/40" onClick={(e) => e.stopPropagation()}>
          <DataViewFilterControls
            definitions={filterDefinitions}
            values={currentFilters}
            onChange={onFilterChange}
            onReset={() => dataView.onFiltersReset?.()}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs font-medium gap-1 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Filter</span>
                {activeChips.length > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground px-1">
                    {activeChips.length}
                  </span>
                )}
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}
