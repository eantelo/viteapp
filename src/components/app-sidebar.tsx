import * as React from "react";
import { useLocation } from "react-router-dom";
import {
  ChartBar,
  SquaresFour,
  Kanban,
  Package,
  FileText,
  AddressBook,
  Receipt,
  CircleNotch,
  CashRegister,
  Coffee,
  Tag,
  Users,
  Warehouse,
  ArrowsLeftRight,
  Factory,
  ShoppingCart,
} from "@phosphor-icons/react";

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
      icon: SquaresFour,
    },
    {
      title: "Ventas",
      url: "/sales",
      icon: Receipt,
    },
    {
      title: "Punto de Venta",
      url: "/pos",
      icon: CashRegister,
    },
    {
      title: "Productos",
      url: "/products",
      icon: Package,
    },
    {
      title: "Categorías",
      url: "/categories",
      icon: Tag,
    },
    {
      title: "Clientes",
      url: "/customers",
      icon: AddressBook,
    },
    {
      title: "Proveedores",
      url: "/suppliers",
      icon: Factory,
    },
    {
      title: "Compras",
      url: "/purchases",
      icon: ShoppingCart,
    },
    {
      title: "CRM",
      url: "/crm",
      icon: Kanban,
    },
    {
      title: "Usuarios",
      url: "/users",
      icon: Users,
    },
    {
      title: "Almacenes",
      url: "/warehouses",
      icon: Warehouse,
    },
    {
      title: "Traslados",
      url: "/warehouse-transfers",
      icon: ArrowsLeftRight,
    },
    {
      title: "POS Restaurante",
      url: "/pos/restaurant",
      icon: Coffee,
    },
  ],
  navReports: [
    {
      title: "Ventas Mensuales",
      url: "/reports/sales-monthly",
      icon: ChartBar,
    },
    {
      title: "Inventario",
      url: "/reports/inventario",
      icon: FileText,
    },
    {
      title: "Clientes",
      url: "/reports/clientes",
      icon: FileText,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { auth, hasPermission } = useAuth();
  const location = useLocation();
  const tenantName = auth?.tenantName || "Mi Empresa";

  const filteredNavItems = data.navMain.filter((item) => {
    if (item.url === "/users") {
      return hasPermission("Users.View");
    }

    if (item.url === "/settings") {
      return hasPermission("Settings.View");
    }

    return true;
  });

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
                  <CircleNotch className="size-5!" weight="duotone" />
                <span className="sidebar-text-lg font-semibold">{tenantName}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavItems} />
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
