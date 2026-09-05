"use client";

import * as React from "react";
import { Switch } from "../ui/switch";
import { cn } from "../../lib/utils";

export interface StatusSwitchProps {
  status: string;
  onStatusChange?: (newStatus: string) => void;
  activeValue?: string;
  inactiveValue?: string;
  disabled?: boolean;
  className?: string;
}

export function StatusSwitch({
  status,
  onStatusChange,
  activeValue = "Active",
  inactiveValue = "Draft",
  disabled = false,
  className,
}: StatusSwitchProps) {
  const [currentStatus, setCurrentStatus] = React.useState(status);

  React.useEffect(() => {
    setCurrentStatus(status);
  }, [status]);

  const isActive = currentStatus.toLowerCase() === activeValue.toLowerCase();

  const handleToggle = (checked: boolean) => {
    const isLower = status === status.toLowerCase();
    const targetActive = isLower ? activeValue.toLowerCase() : activeValue;
    const defaultOff = isLower ? inactiveValue.toLowerCase() : inactiveValue;

    // If turning OFF and current status was active, set to inactiveValue.
    // If turning OFF and current status was already a non-active value (e.g. Draft, Proposed), keep it or default to inactiveValue.
    const nextStatus = checked
      ? targetActive
      : !isActive
        ? currentStatus
        : defaultOff;

    setCurrentStatus(nextStatus);
    onStatusChange?.(nextStatus);
  };

  return (
    <div
      className={cn("flex items-center gap-2", className)}
      onClick={(e) => e.stopPropagation()}
    >
      <Switch
        checked={isActive}
        onCheckedChange={handleToggle}
        disabled={disabled}
        aria-label={`Toggle status, currently ${currentStatus}`}
      />
    </div>
  );
}
