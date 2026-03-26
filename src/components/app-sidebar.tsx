import * as React from "react";
import { Link } from "react-router-dom";
import {
  SquaresFour,
  Kanban,
  Package,
  AddressBook,
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
import { FEATURES } from "@/lib/features";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: SquaresFour,
    },
    {
      title: "Ventas",
      url: "/sales",
      icon: ShoppingCart,
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
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { auth, hasPermission, hasFeature, logout } = useAuth();
  const tenantName = auth?.tenantName || "Mi Empresa";

  const filteredNavItems = data.navMain.filter((item) => {
    if (item.url === "/users") {
      return hasPermission("Users.View");
    }

    if (item.url === "/settings") {
      return hasPermission("Settings.View");
    }

    if (item.url === "/categories") {
      return hasFeature(FEATURES.CATEGORIES);
    }

    if (item.url === "/suppliers") {
      return hasFeature(FEATURES.SUPPLIERS);
    }

    if (item.url === "/purchases") {
      return hasFeature(FEATURES.PURCHASES);
    }

    if (item.url === "/crm") {
      return hasFeature(FEATURES.CRM);
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
              <Link to="/dashboard">
                <CircleNotch className="size-5!" weight="duotone" />
                <span className="sidebar-text-lg font-semibold">{tenantName}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          email={auth?.email}
          role={auth?.role}
          onLogout={logout}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
