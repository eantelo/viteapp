import * as React from "react";
import { Link } from "react-router-dom";
import {
  AddressBook,
  ArrowsLeftRight,
  CashRegister,
  CircleNotch,
  Coffee,
  Factory,
  Kanban,
  Package,
  ShoppingCart,
  SquaresFour,
  Tag,
  Users,
  Warehouse,
  type IconProps,
} from "@phosphor-icons/react";

import { NavMain, type NavGroup } from "@/components/nav-main";
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

interface NavigationItem {
  title: string;
  url: string;
  icon: React.ComponentType<IconProps>;
  feature?: string;
  permission?: string;
}

interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

const navigationGroups: NavigationGroup[] = [
  {
    label: "Resumen",
    items: [{ title: "Inicio", url: "/dashboard", icon: SquaresFour }],
  },
  {
    label: "Ventas",
    items: [
      { title: "Punto de venta", url: "/pos", icon: CashRegister },
      { title: "Historial de ventas", url: "/sales", icon: ShoppingCart },
      { title: "POS restaurante", url: "/pos/restaurant", icon: Coffee },
    ],
  },
  {
    label: "Catálogo e inventario",
    items: [
      { title: "Productos", url: "/products", icon: Package },
      {
        title: "Categorías",
        url: "/categories",
        icon: Tag,
        feature: FEATURES.CATEGORIES,
      },
      { title: "Almacenes", url: "/warehouses", icon: Warehouse },
      {
        title: "Traslados",
        url: "/warehouse-transfers",
        icon: ArrowsLeftRight,
      },
    ],
  },
  {
    label: "Compras",
    items: [
      {
        title: "Compras",
        url: "/purchases",
        icon: ShoppingCart,
        feature: FEATURES.PURCHASES,
      },
      {
        title: "Proveedores",
        url: "/suppliers",
        icon: Factory,
        feature: FEATURES.SUPPLIERS,
      },
    ],
  },
  {
    label: "Relaciones",
    items: [
      { title: "Clientes", url: "/customers", icon: AddressBook },
      {
        title: "CRM",
        url: "/crm",
        icon: Kanban,
        feature: FEATURES.CRM,
      },
    ],
  },
  {
    label: "Administración",
    items: [
      {
        title: "Usuarios",
        url: "/users",
        icon: Users,
        permission: "Users.View",
      },
    ],
  },
];

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { auth, hasPermission, hasFeature, logout } = useAuth();
  const tenantName = auth?.tenantName || "Mi Empresa";

  const filteredNavGroups: NavGroup[] = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.permission && !hasPermission(item.permission)) {
          return false;
        }

        if (item.feature && !hasFeature(item.feature)) {
          return false;
        }

        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border/70 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              tooltip={tenantName}
              className="data-[slot=sidebar-menu-button]:p-0!"
            >
              <Link to="/dashboard" aria-label={`Ir al inicio de ${tenantName}`}>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <CircleNotch
                    className="size-5"
                    weight="duotone"
                    aria-hidden="true"
                  />
                </span>
                <span className="min-w-0 group-data-[collapsible=icon]:hidden">
                  <span className="sidebar-text-lg block truncate font-semibold">
                    {tenantName}
                  </span>
                  <span className="block truncate text-xs text-sidebar-foreground/60">
                    SalesNet
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="py-2">
        <NavMain groups={filteredNavGroups} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/70">
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
