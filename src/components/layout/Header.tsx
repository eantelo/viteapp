import { useState } from "react";
import { Bell, Building2, ChevronDown, HelpCircle, Search, Settings, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/Spinner";
import type { BreadcrumbItem as BreadcrumbItemType } from "./DashboardLayout";

interface HeaderProps {
  breadcrumbs: BreadcrumbItemType[];
}

export function Header({ breadcrumbs }: HeaderProps) {
  const { auth, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notificationCount] = useState(3); // Mock notification count

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Separar último breadcrumb (página actual) del resto
  const parentBreadcrumbs = breadcrumbs.slice(0, -1);
  const currentPage = breadcrumbs[breadcrumbs.length - 1];

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!auth?.email) return "U";
    const parts = auth.email.split("@")[0].split(".");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return auth.email[0].toUpperCase();
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 shadow-sm transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      {/* Left Section: Sidebar Trigger + Breadcrumbs */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-6"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {parentBreadcrumbs.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <BreadcrumbItem className="hidden md:block">
                  {item.href ? (
                    <BreadcrumbLink href={item.href}>
                      {item.label}
                    </BreadcrumbLink>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
              </div>
            ))}
            <BreadcrumbItem>
              <BreadcrumbPage>{currentPage.label}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Center Section: Search (hidden on mobile) */}
      <div className="hidden lg:flex items-center flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="Buscar..."
            className="w-full pl-9 pr-4 h-9 bg-slate-50 border-slate-200 focus:bg-white"
          />
        </div>
      </div>

      {/* Right Section: Tenant Switcher + Notifications + Help + User Menu */}
      <div className="flex items-center gap-2 flex-1 justify-end">
        {/* Tenant Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex items-center gap-2 h-9 px-3"
            >
              <Building2 className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">
                {auth?.tenantId || "Sin tenant"}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Cambiar Tenant</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Building2 className="mr-2 h-4 w-4" />
              <span>{auth?.tenantId || "Tenant Actual"}</span>
              <Badge variant="secondary" className="ml-auto">
                Actual
              </Badge>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs text-slate-500">
              Más tenants disponibles próximamente
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4 text-slate-600" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {notificationCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notificaciones</span>
              <Badge variant="secondary">{notificationCount}</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-y-auto">
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                <div className="flex items-center gap-2 w-full">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="font-medium text-sm">Nueva venta registrada</span>
                  <span className="ml-auto text-xs text-slate-500">5m</span>
                </div>
                <p className="text-xs text-slate-600 pl-4">
                  Se ha completado una venta por $1,234.56
                </p>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                <div className="flex items-center gap-2 w-full">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="font-medium text-sm">Producto actualizado</span>
                  <span className="ml-auto text-xs text-slate-500">1h</span>
                </div>
                <p className="text-xs text-slate-600 pl-4">
                  El inventario de "Producto X" ha sido actualizado
                </p>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                <div className="flex items-center gap-2 w-full">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span className="font-medium text-sm">Stock bajo</span>
                  <span className="ml-auto text-xs text-slate-500">2h</span>
                </div>
                <p className="text-xs text-slate-600 pl-4">
                  El producto "Producto Y" tiene stock bajo
                </p>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-sm text-primary">
              Ver todas las notificaciones
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Help */}
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <HelpCircle className="h-4 w-4 text-slate-600" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-9 px-2 hover:bg-slate-100"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src="" alt={auth?.email || "User"} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex flex-col items-start">
                <span className="text-sm font-medium text-slate-900 leading-none">
                  {auth?.email?.split("@")[0] || "Usuario"}
                </span>
                <span className="text-xs text-slate-500 leading-none mt-0.5">
                  {auth?.role || "Sin rol"}
                </span>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400 hidden lg:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {auth?.email?.split("@")[0] || "Usuario"}
                </p>
                <p className="text-xs leading-none text-slate-500">
                  {auth?.email || "usuario@ejemplo.com"}
                </p>
                <div className="pt-1">
                  <Badge variant="outline" className="text-xs">
                    {auth?.role || "Sin rol"}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-red-600 focus:text-red-600"
            >
              {isLoggingOut && <Spinner size="sm" className="mr-2 text-current" />}
              <span>{isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
