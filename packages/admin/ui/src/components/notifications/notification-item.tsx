"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import type { NotificationItemData, NotificationPresentationTone } from "./notification-types";

function toneToIconColor(tone: NotificationPresentationTone | undefined): string {
  switch (tone) {
    case "success":
      return "bg-emerald-500";
    case "warning":
      return "bg-amber-500";
    case "destructive":
      return "bg-destructive";
    default:
      return "bg-primary";
  }
}

export interface NotificationItemProps {
  notification: NotificationItemData;
  onClick?: ((id: string) => void) | undefined;
  className?: string | undefined;
}

export function NotificationItem({
  notification,
  onClick,
  className,
}: NotificationItemProps) {
  const { id, title, description, timestamp, unread, tone } = notification;

  const handleClick = () => onClick?.(id);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(id);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "w-full text-left px-4 py-3 flex items-start gap-3 transition-colors",
        "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        unread && "bg-muted/30",
        className
      )}
    >
      {/* Unread indicator dot */}
      <span className="mt-1.5 shrink-0 w-2 h-2 flex items-center justify-center">
        {unread && (
          <span
            className={cn(
              "block w-2 h-2 rounded-full shrink-0",
              toneToIconColor(tone)
            )}
            aria-hidden="true"
          />
        )}
      </span>

      <div className="min-w-0 flex-1 space-y-0.5">
        <p
          className={cn(
            "text-sm leading-snug text-foreground truncate",
            unread ? "font-semibold" : "font-normal"
          )}
        >
          {title}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {description}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground/70 mt-0.5">
          {timestamp}
        </p>
      </div>
    </button>
  );
}
