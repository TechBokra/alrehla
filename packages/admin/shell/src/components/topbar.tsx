import * as React from "react";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";
import { Button } from "@eng-mohamedelsayed/admin-ui/components/ui/button";
import { Separator } from "@eng-mohamedelsayed/admin-ui/components/ui/separator";
import { SidebarTrigger } from "@eng-mohamedelsayed/admin-ui/components/ui/sidebar";

export interface TopbarProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  badgeText?: string;
  breadcrumbsSlot?: React.ReactNode;
  themeToggleSlot?: React.ReactNode;
  /**
   * Generic slot for trailing global actions (e.g. notification center,
   * command palette, help). Use this instead of feature-specific slots.
   */
  trailingActions?: React.ReactNode;
  actionsSlot?: React.ReactNode;
  userSlot?: React.ReactNode;
}

export function Topbar({
  title = "Collections",
  badgeText = "Pilot",
  breadcrumbsSlot,
  themeToggleSlot,
  trailingActions,
  actionsSlot,
  userSlot,
  className,
  ...props
}: TopbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/80 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
      {...props}
    >
      {/* Left: sidebar toggle + title */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="h-8 w-8 -ml-1 text-muted-foreground hover:text-foreground" />
        <Separator orientation="vertical" className="h-4 mx-1" />
        {breadcrumbsSlot ?? (
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            {badgeText && (
              <span className="rounded-full bg-amber-100/90 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200/90 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60">
                {badgeText}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: trailing global actions + theme + app actions + user */}
      <div className="flex items-center gap-1.5">
        {trailingActions}

        {themeToggleSlot}

        {actionsSlot ?? (
          <Button
            size="sm"
            className="h-8 gap-1.5 font-medium px-3 text-xs shadow-sm bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <span className="text-sm font-light">+</span> Quick create
          </Button>
        )}
        {userSlot}
      </div>
    </header>
  );
}

