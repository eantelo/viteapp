import { PlusCircle, type IconProps } from "@phosphor-icons/react";
import type { ComponentType } from "react";
import { Link, useLocation } from "react-router-dom";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export interface NavItem {
  title: string;
  url: string;
  icon?: ComponentType<IconProps>;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Navegación principal agrupada por las tareas operativas del usuario.
 */
export function NavMain({ groups }: { groups: NavGroup[] }) {
  const location = useLocation();
  const activeUrl = groups
    .flatMap((group) => group.items)
    .filter(
      (item) =>
        location.pathname === item.url ||
        location.pathname.startsWith(`${item.url}/`)
    )
    .sort((left, right) => right.url.length - left.url.length)[0]?.url;

  return (
    <nav aria-label="Navegación principal" className="flex flex-col">
      <SidebarGroup className="pb-1 pt-0">
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Nueva venta"
                isActive={location.pathname === "/sales/new"}
                className="sidebar-text min-w-8 bg-primary text-primary-foreground shadow-sm duration-150 hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
              >
                <Link
                  to="/sales/new"
                  aria-current={
                    location.pathname === "/sales/new" ? "page" : undefined
                  }
                >
                  <PlusCircle weight="fill" aria-hidden="true" />
                  <span>Nueva venta</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {groups.map((group) => (
        <SidebarGroup key={group.label} className="py-1">
          <SidebarGroupLabel className="h-7 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/55">
            {group.label}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive = activeUrl === item.url;

                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      asChild
                      isActive={isActive}
                      className="sidebar-text"
                    >
                      <Link
                        to={item.url}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {item.icon && <item.icon aria-hidden="true" />}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </nav>
  );
}
