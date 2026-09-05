"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

export interface NotificationBellProps {
  unreadCount?: number;
  onClick?: () => void;
  className?: string;
}

/** Formatted accessible label for the bell button. */
function getBellLabel(count: number): string {
  if (count === 0) return "Notifications";
  if (count === 1) return "Notifications, 1 unread";
  return `Notifications, ${count} unread`;
}

/** Display value for the badge (capped at 99+). */
function getBadgeText(count: number): string {
  return count > 99 ? "99+" : String(count);
}

export function NotificationBell({
  unreadCount = 0,
  onClick,
  className,
}: NotificationBellProps) {
  const label = getBellLabel(unreadCount);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "relative h-8 w-8 text-muted-foreground hover:text-foreground",
              className
            )}
            onClick={onClick}
            aria-label={label}
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            {unreadCount > 0 && (
              <span
                className="absolute top-0.5 right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm tabular-nums"
                aria-hidden="true"
              >
                {getBadgeText(unreadCount)}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
