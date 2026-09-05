"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { useDataView } from "./data-view-context";

export interface DataViewSwitcherProps {
  className?: string | undefined;
  size?: ("sm" | "default") | undefined;
}

export function DataViewSwitcher({
  className,
  size = "sm",
}: DataViewSwitcherProps) {
  const { viewList, activeView, setActiveView } = useDataView();
  const activeIsSelectable = viewList.some((view) => view.id === activeView);
  const tabStop = activeIsSelectable ? activeView : viewList[0]?.id;

  if (viewList.length === 0 || (viewList.length === 1 && activeIsSelectable)) {
    return null;
  }

  return (
    <div
      role="tablist"
      aria-label="Select data view"
      className={cn(
        "inline-flex items-center justify-center rounded-lg bg-muted/80 p-0.5 text-muted-foreground border border-border/50 select-none",
        size === "sm" ? "h-8" : "h-9",
        className
      )}
    >
      {viewList.map((view) => {
        const isActive = activeView === view.id;
        const IconComponent = view.icon;

        return (
          <button
            key={view.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            tabIndex={view.id === tabStop ? 0 : -1}
            onClick={() => setActiveView(view.id)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              isActive
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            )}
          >
            {IconComponent && <IconComponent className="h-3.5 w-3.5 shrink-0" />}
            <span className="inline">{view.label}</span>
          </button>
        );
      })}
    </div>
  );
}
