import type { LucideIcon } from "lucide-react";
import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@eng-mohamedelsayed/admin-ui/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SubNavItem = {
  title: string;
  href: string;
  badge?: string;
};

export type NavItem = {
  title: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  items?: SubNavItem[];
};

export type NavGroup = {
  label: string;
  badge?: string | undefined;
  items: NavItem[];
};

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  brandSlot?: React.ReactNode;
  navGroups: NavGroup[];
  activeHref?: string;
  onNavigate?: (href: string) => void;
  userProfile?: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
  onLogout?: () => void;
  secondaryItems?: { title: string; href: string; icon: LucideIcon }[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AppSidebar({
  brandSlot,
  navGroups,
  activeHref = "/",
  onNavigate,
  userProfile = { name: "Admin", email: "admin@store.com" },
  onLogout,
  secondaryItems = [],
  ...props
}: AppSidebarProps) {
  const userForNav = {
    name: userProfile.name,
    email: userProfile.email,
    avatar: userProfile.avatarUrl ?? "",
  };

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarContent>
        {navGroups.map((group) => {
          const groupItems = group.items.map((item) => {
            const isActive = item.items
              ? item.items.some(
                  (sub) =>
                    activeHref === sub.href ||
                    (sub.href !== "/" && activeHref.startsWith(`${sub.href}/`))
                )
              : activeHref === item.href ||
                (!!item.href &&
                  item.href !== "/" &&
                  activeHref.startsWith(`${item.href}/`));
            const subItems = item.items?.map((sub) => ({
              title: sub.title,
              url: sub.href,
            }));
            return {
              title: item.title,
              url: item.href ?? "#",
              icon: item.icon as LucideIcon,
              isActive,
              ...(item.badge ? { badge: item.badge } : {}),
              ...(subItems ? { items: subItems } : {}),
            };
          });

          return (
            <NavMain
              key={group.label}
              groupLabel={group.label}
              {...(group.badge ? { badge: group.badge } : {})}
              items={groupItems}
            />
          );
        })}
        {secondaryItems.length > 0 && (
          <NavSecondary
            items={secondaryItems.map((i) => ({
              title: i.title,
              url: i.href,
              icon: i.icon,
            }))}
            className="mt-auto"
          />
        )}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={userForNav} logout={onLogout} />
      </SidebarFooter>
    </Sidebar>
  );
}
