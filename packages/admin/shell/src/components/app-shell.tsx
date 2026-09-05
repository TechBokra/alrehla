import * as React from "react";
import { Toaster } from "sonner";
import { SidebarInset, SidebarProvider } from "@eng-mohamedelsayed/admin-ui/components/ui/sidebar";

export interface AppShellProps {
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ sidebar, header, children }: AppShellProps) {
  return (
    <div className="[--header-height:3.5rem]">
      <SidebarProvider className="flex flex-col">
        {header}
        <div className="flex flex-1 min-h-[calc(100svh-3.5rem)]">
          {sidebar}
          {/* SidebarInset renders as <main> with flex-1 built-in */}
          <SidebarInset>
            <div className="p-6 md:p-8 space-y-6 w-full">{children}</div>
            <Toaster richColors position="top-right" />
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
