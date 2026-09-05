"use client";

import * as React from "react";
import { Check, Rows3 } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { useResource } from "@eng-mohamedelsayed/admin-core/resource";
import type { ResourceDensity } from "@eng-mohamedelsayed/admin-core/resource";

export interface ResourceDensityMenuProps {
  className?: string | undefined;
  size?: ("sm" | "default") | undefined;
}

const DENSITY_OPTIONS: { value: ResourceDensity; label: string; description: string }[] = [
  { value: "compact", label: "Compact", description: "Condensed row height and smaller padding" },
  { value: "comfortable", label: "Comfortable", description: "Default standard spacing" },
  { value: "spacious", label: "Spacious", description: "Relaxed row height and generous padding" },
];

export function ResourceDensityMenu({
  className,
  size = "sm",
}: ResourceDensityMenuProps) {
  const { density, setDensity } = useResource();

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size={size}
                className={cn(
                  "h-8 gap-1.5 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground",
                  className
                )}
                aria-label="Change table density"
              >
                <Rows3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline capitalize">{density}</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">Row Density</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Row Density
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {DENSITY_OPTIONS.map((opt) => {
          const isSelected = density === opt.value;
          return (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => setDensity(opt.value)}
              className="flex items-center justify-between text-xs cursor-pointer py-1.5"
            >
              <div className="flex flex-col">
                <span className={cn("font-medium", isSelected && "text-primary font-semibold")}>
                  {opt.label}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {opt.description}
                </span>
              </div>
              {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
