import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@eng-mohamedelsayed/admin-ui/components/ui/sheet";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";
import { ScrollArea } from "@eng-mohamedelsayed/admin-ui/components/ui/scroll-area";
import { FormHeaderTitle } from "./form-header";

export interface FormSheetProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactElement;
  title: string;
  icon?: React.ElementType<{ className?: string }>;
  description?: React.ReactNode;
  children: React.ReactNode;
  side?: "right" | "left";
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
  bodyClassName?: string;
}

export function FormSheet({
  open,
  onOpenChange,
  defaultOpen,
  trigger,
  title,
  icon: Icon,
  description,
  children,
  side = "right",
  size = "md",
  className,
  bodyClassName,
}: FormSheetProps) {
  const sizeClass = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    full: "sm:max-w-3xl",
  }[size];

  return (
    <Sheet
      {...(open === undefined ? {} : { open })}
      {...(defaultOpen === undefined ? {} : { defaultOpen })}
      {...(onOpenChange ? { onOpenChange } : {})}
    >
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent
        side={side}
        className={cn(
          "flex h-dvh max-h-dvh w-full flex-col gap-0 overflow-hidden p-0",
          sizeClass,
          className
        )}
      >
        <SheetHeader className="shrink-0 border-b px-6 py-4 pr-12">
          <SheetTitle>
            <FormHeaderTitle icon={Icon}>{title}</FormHeaderTitle>
          </SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1">
          <div className={cn("px-6 py-4", bodyClassName)}>{children}</div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
