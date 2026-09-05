import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@eng-mohamedelsayed/admin-ui/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@eng-mohamedelsayed/admin-ui/components/ui/sidebar";

export function NavMain({
  groupLabel,
  badge,
  items,
}: {
  groupLabel?: string | undefined;
  badge?: string | undefined;
  items: {
    title: string;
    url: string;
    icon?: LucideIcon | undefined;
    badge?: string | undefined;
    isActive?: boolean | undefined;
    items?:
      | {
          title: string;
          url: string;
        }[]
      | undefined;
  }[];
}) {
  return (
    <SidebarGroup>
      {groupLabel ? (
        <SidebarGroupLabel className="flex items-center justify-between">
          <span>{groupLabel}</span>
          {badge ? (
            <span className="inline-flex items-center rounded-md border border-transparent bg-secondary px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wide text-secondary-foreground">
              {badge}
            </span>
          ) : null}
        </SidebarGroupLabel>
      ) : null}
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive ?? false}
          >
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={item.isActive ?? false}
              >
                <Link
                  href={item.url}
                  className="flex items-center justify-between w-full"
                >
                  <span className="flex items-center gap-2 truncate">
                    {item.icon ? <item.icon /> : null}
                    <span>{item.title}</span>
                  </span>
                  {item.badge ? (
                    <span className="ml-auto inline-flex items-center rounded-md border border-transparent bg-secondary px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wide text-secondary-foreground shrink-0">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              </SidebarMenuButton>
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="data-[state=open]:rotate-90">
                      <ChevronRight />
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
