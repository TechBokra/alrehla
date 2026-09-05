"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";
import { Button } from "@eng-mohamedelsayed/admin-ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@eng-mohamedelsayed/admin-ui/components/ui/dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@eng-mohamedelsayed/admin-ui/components/ui/sidebar";
import { MutationSubmitButton } from "./mutation-submit-button";
import { FormHeaderTitle } from "./form-header";
import type { FormSectionOwnership } from "@eng-mohamedelsayed/admin-core/resource";

export interface FormWizardTabItem extends FormSectionOwnership {
  label: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }> | undefined;
  badge?: string | undefined;
  description?: string | undefined;
  /** Headless error metadata for consumers; presentation remains caller-owned. */
  errorCount?: number | undefined;
  hasError?: boolean | undefined;
  firstInvalidFieldPath?: string | undefined;
}

export interface FormWizardTabGroup {
  label: string;
  items: FormWizardTabItem[];
}

export interface FormWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  headerIcon?: React.ElementType<{ className?: string }>;
  description?: string | undefined;
  groups: FormWizardTabGroup[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
  onSubmit: () => void | Promise<void>;
  onCancel?: (() => void) | undefined;
  isPending?: boolean | undefined;
  submitLabel?: React.ReactNode | undefined;
  cancelLabel?: string | undefined;
  isSuccess?: boolean | undefined;
  error?: Error | null | undefined;
  className?: string | undefined;
}

export function FormWizardDialog({
  open,
  onOpenChange,
  title,
  headerIcon: HeaderIcon,
  description,
  groups,
  activeTab,
  onTabChange,
  children,
  onSubmit,
  onCancel,
  isPending = false,
  submitLabel = "Save changes",
  cancelLabel = "Cancel",
  isSuccess = false,
  error = null,
  className,
}: FormWizardDialogProps) {
  // Find all tab IDs sequentially for step navigation
  const allTabs = React.useMemo(() => {
    return groups.flatMap((group) => group.items);
  }, [groups]);

  const currentIndex = allTabs.findIndex((tab) => tab.id === activeTab);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allTabs.length - 1;

  const handlePrevious = () => {
    const prev = allTabs[currentIndex - 1];
    if (hasPrevious && prev) {
      onTabChange(prev.id);
    }
  };

  const handleNext = () => {
    const next = allTabs[currentIndex + 1];
    if (hasNext && next) {
      onTabChange(next.id);
    }
  };

  const currentTabInfo = allTabs.find((tab) => tab.id === activeTab);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-4xl overflow-hidden p-0 sm:max-h-[85vh] sm:max-w-5xl md:max-w-6xl",
          className
        )}
      >
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="text-lg font-semibold text-foreground">
            <FormHeaderTitle icon={HeaderIcon}>{title}</FormHeaderTitle>
          </DialogTitle>
          {description ? (
            <DialogDescription className="text-xs text-muted-foreground">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        {/* Mobile Section Navigation (md:hidden) */}
        <div className="border-b border-border bg-muted/30 px-4 py-2 md:hidden">
          <div
            className="flex items-center gap-1.5 overflow-x-auto py-0.5"
            role="tablist"
            aria-label="Form sections"
          >
            {allTabs.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const errorCount = item.errorCount ?? 0;
              const hasError = item.hasError || errorCount > 0;
              const displayCount = errorCount > 99 ? "99+" : errorCount;
              const accessibleLabel =
                errorCount > 0
                  ? `${item.label}, ${errorCount} ${errorCount === 1 ? "error" : "errors"}`
                  : item.label;

              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={accessibleLabel}
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors shrink-0 cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : "bg-background text-muted-foreground hover:bg-accent hover:text-foreground border border-border/60",
                    hasError &&
                      !isActive &&
                      "border-destructive/60 text-destructive bg-destructive/5 hover:bg-destructive/10"
                  )}
                >
                  {Icon ? (
                    <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  ) : null}
                  <span>{item.label}</span>
                  {hasError ? (
                    <span
                      className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold bg-destructive text-destructive-foreground shrink-0 shadow-xs"
                      aria-hidden="true"
                    >
                      {errorCount > 0 ? displayCount : "!"}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar-13 Split Layout */}
        <SidebarProvider className="items-start min-h-[450px] md:min-h-[500px] h-[calc(85vh-130px)]">
          {/* Left Vertical Section Navigation */}
          <Sidebar
            collapsible="none"
            className="w-56 border-r border-sidebar-border bg-sidebar shrink-0 hidden md:flex h-full"
          >
            <SidebarContent className="p-2 space-y-4">
              {groups.map((group) => (
                <SidebarGroup key={group.label} className="p-0">
                  <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {group.label}
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu className="space-y-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        const errorCount = item.errorCount ?? 0;
                        const hasError = item.hasError || errorCount > 0;
                        const displayCount =
                          errorCount > 99 ? "99+" : errorCount;
                        const accessibleLabel =
                          errorCount > 0
                            ? `${item.label}, ${errorCount} ${errorCount === 1 ? "error" : "errors"}`
                            : item.label;

                        return (
                          <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton
                              isActive={isActive}
                              aria-label={accessibleLabel}
                              aria-current={isActive ? "page" : undefined}
                              onClick={() => onTabChange(item.id)}
                              className={cn(
                                "flex items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer select-none",
                                isActive
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                              )}
                            >
                              <span className="flex items-center gap-2.5 truncate">
                                {Icon ? (
                                  <Icon
                                    className="h-4 w-4 shrink-0"
                                    aria-hidden="true"
                                  />
                                ) : null}
                                <span>{item.label}</span>
                              </span>
                              <div className="ml-auto flex items-center gap-1.5 shrink-0">
                                {hasError ? (
                                  <span
                                    className="inline-flex items-center justify-center min-w-[18px] h-4.5 px-1.5 rounded-full text-[10px] font-bold bg-destructive text-destructive-foreground shrink-0 shadow-xs"
                                    aria-hidden="true"
                                  >
                                    {errorCount > 0 ? displayCount : "!"}
                                  </span>
                                ) : item.badge ? (
                                  <span className="inline-flex items-center rounded-md border border-transparent bg-secondary px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wide text-secondary-foreground shrink-0">
                                    {item.badge}
                                  </span>
                                ) : null}
                              </div>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </SidebarContent>
          </Sidebar>

          {/* Right Main Content Panel */}
          <main className="flex h-full flex-1 flex-col overflow-hidden bg-background">
            {/* Header section for current tab */}
            {currentTabInfo ? (
              <div className="border-b border-border bg-muted/20 px-6 py-3">
                <h3 className="text-sm font-semibold text-foreground">
                  {currentTabInfo.label}
                </h3>
                {currentTabInfo.description ? (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {currentTabInfo.description}
                  </p>
                ) : null}
              </div>
            ) : null}

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {error ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  {error.message || "An error occurred while saving."}
                </div>
              ) : null}
              {children}
            </div>

            {/* Sticky Action Bar Footer */}
            <div className="flex items-center justify-between border-t border-border bg-card px-6 py-3.5 shrink-0">
              <div className="flex items-center gap-2">
                {hasPrevious ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={isPending}
                    className="text-xs"
                  >
                    Previous
                  </Button>
                ) : null}
                {hasNext ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={isPending}
                    className="text-xs"
                  >
                    Next section
                  </Button>
                ) : null}
              </div>

              <div className="flex items-center gap-3">
                {onCancel ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onCancel}
                    disabled={isPending}
                    className="text-xs"
                  >
                    {cancelLabel}
                  </Button>
                ) : null}
                <MutationSubmitButton
                  isPending={isPending}
                  onClick={() => void onSubmit()}
                  size="sm"
                  className="text-xs font-semibold"
                >
                  {submitLabel}
                </MutationSubmitButton>
              </div>
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}
