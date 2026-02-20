import * as React from "react";
import { useLocation } from "react-router-dom";
import {
  IconChartBar,
  IconDashboard,
  IconLayoutKanban,
  IconPackage,
  IconReport,
  IconAddressBook,
  IconReceipt,
  IconInnerShadowTop,
  IconCashRegister,
  IconCoffee,
  IconTags,
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { useAuth } from "@/context/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Ventas",
      url: "/sales",
      icon: IconReceipt,
    },
    {
      title: "Punto de Venta",
      url: "/pos",
      icon: IconCashRegister,
    },
    {
      title: "Productos",
      url: "/products",
      icon: IconPackage,
    },
    {
      title: "Categorías",
      url: "/categories",
      icon: IconTags,
    },
    {
      title: "Clientes",
      url: "/customers",
      icon: IconAddressBook,
    },
    {
      title: "CRM",
      url: "/crm",
      icon: IconLayoutKanban,
    },
    {
      title: "POS Restaurante",
      url: "/pos/restaurant",
      icon: IconCoffee,
    },
  ],
  navReports: [
    {
      title: "Ventas Mensuales",
      url: "/reports/sales-monthly",
      icon: IconChartBar,
    },
    {
      title: "Inventario",
      url: "/reports/inventario",
      icon: IconReport,
    },
    {
      title: "Clientes",
      url: "/reports/clientes",
      icon: IconReport,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { auth } = useAuth();
  const location = useLocation();
  const tenantName = auth?.tenantName || "Mi Empresa";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="#">
                <IconInnerShadowTop className="size-5!" />
                <span className="sidebar-text-lg font-semibold">{tenantName}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <SidebarGroup>
          <SidebarGroupLabel>Reportes</SidebarGroupLabel>
          <SidebarMenu>
            {data.navReports.map((item) => {
              const isActive = location.pathname === item.url || location.pathname.startsWith(item.url + '/');
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <a href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
