import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@eng-mohamedelsayed/admin-ui/components/ui/dialog";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";
import { ScrollArea } from "@eng-mohamedelsayed/admin-ui/components/ui/scroll-area";
import { FormHeaderTitle } from "./form-header";

export interface FormDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactElement;
  title: string;
  icon?: React.ElementType<{ className?: string }>;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  bodyClassName?: string;
}

export function FormDialog({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  title,
  icon: Icon,
  description,
  children,
  maxWidth = "lg",
  className,
  bodyClassName,
}: FormDialogProps) {
  const maxWidthClass =
    maxWidth === "sm"
      ? "sm:max-w-sm"
      : maxWidth === "md"
        ? "sm:max-w-md"
        : maxWidth === "xl"
          ? "sm:max-w-xl"
          : maxWidth === "2xl"
            ? "sm:max-w-2xl"
            : "sm:max-w-lg";

  return (
    <Dialog
      {...(open === undefined ? {} : { open })}
      {...(defaultOpen === undefined ? {} : { defaultOpen })}
      {...(onOpenChange ? { onOpenChange } : {})}
    >
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className={cn(
          maxWidthClass,
          "flex h-[min(90vh,48rem)] max-h-[90vh] flex-col gap-0 overflow-hidden p-0",
          className
        )}
      >
        <DialogHeader className="shrink-0 border-b px-6 py-4 pr-12">
            <DialogTitle>
              <FormHeaderTitle icon={Icon}>{title}</FormHeaderTitle>
            </DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
        </DialogHeader>
        <ScrollArea className="min-h-0 flex-1">
          <div className={cn("px-6 py-4", bodyClassName)}>{children}</div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
