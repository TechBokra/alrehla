"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import type { CalendarMode } from "./calendar-types";

export interface CalendarToolbarProps {
  title: string;
  mode: CalendarMode;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onModeChange: (mode: CalendarMode) => void;
  className?: string;
}

const MODE_OPTIONS: Array<{ id: CalendarMode; label: string }> = [
  { id: "dayGridMonth", label: "Month" },
  { id: "timeGridWeek", label: "Week" },
  { id: "timeGridDay", label: "Day" },
];

export function CalendarToolbar({
  title,
  mode,
  onPrev,
  onNext,
  onToday,
  onModeChange,
  className,
}: CalendarToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 py-2 sm:flex-row sm:items-center sm:justify-between select-none",
        className
      )}
    >
      {/* Left: Navigation and Today */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center rounded-md border border-border shadow-xs">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onPrev}
            aria-label="Previous period"
            className="h-8 w-8 p-0 rounded-r-none hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="h-4 w-px bg-border" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onNext}
            aria-label="Next period"
            className="h-8 w-8 p-0 rounded-l-none hover:bg-muted"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onToday}
          className="h-8 px-3 text-xs font-medium"
        >
          Today
        </Button>

        {/* Period Title */}
        <h3
          aria-live="polite"
          className="ml-2 text-sm md:text-base font-semibold tracking-tight text-foreground truncate"
        >
          {title}
        </h3>
      </div>

      {/* Right: Mode Switcher (Month, Week, Day) */}
      <div
        role="tablist"
        aria-label="Calendar view mode"
        className="inline-flex h-8 items-center justify-center rounded-lg bg-muted/80 p-0.5 text-muted-foreground border border-border/50"
      >
        {MODE_OPTIONS.map((option) => {
          const isActive = mode === option.id;
          return (
            <button
              key={option.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onModeChange(option.id)}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isActive
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/40"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
