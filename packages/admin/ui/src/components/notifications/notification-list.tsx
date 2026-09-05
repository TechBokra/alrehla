"use client";

import * as React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import { NotificationItem } from "./notification-item";
import { NotificationSkeleton } from "./notification-skeleton";
import { NotificationEmpty } from "./notification-empty";
import type { NotificationItemData } from "./notification-types";

export interface NotificationListProps {
  notifications: NotificationItemData[];
  isLoading?: boolean;
  error?: string | null;
  onItemClick?: (id: string) => void;
  onRetry?: () => void;
  maxHeight?: number;
}

export function NotificationList({
  notifications,
  isLoading = false,
  error,
  onItemClick,
  onRetry,
  maxHeight = 420,
}: NotificationListProps) {
  if (isLoading && notifications.length === 0) {
    return <NotificationSkeleton />;
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center gap-3 px-4 py-8 text-center"
      >
        <AlertCircle
          className="h-8 w-8 text-muted-foreground/50"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-foreground">
          Couldn't load notifications.
        </p>
        {onRetry && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="gap-1.5 text-xs"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            <span>Retry</span>
          </Button>
        )}
      </div>
    );
  }

  if (notifications.length === 0) {
    return <NotificationEmpty />;
  }

  return (
    <ScrollArea style={{ maxHeight }} className="overflow-y-auto">
      <div
        role="list"
        aria-label="Notifications"
        className="divide-y divide-border/60"
      >
        {notifications.map((notification) => (
          <div key={notification.id} role="listitem">
            <NotificationItem
              notification={notification}
              {...(onItemClick ? { onClick: onItemClick } : {})}
            />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
