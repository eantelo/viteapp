import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Bot,
  Check,
  ChevronDown,
  HelpCircle,
  Laptop,
  Search,
  Settings,
  Trash2,
  User,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useChatDock } from "@/contexts/ChatDockContext";
import { useNotifications } from "@/hooks/useNotifications";
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
import { Switch } from "@/components/ui/switch";
import { ModeToggle } from "@/components/mode-toggle";
import type { BreadcrumbItem as BreadcrumbItemType } from "./DashboardLayout";

interface HeaderProps {
  breadcrumbs: BreadcrumbItemType[];
}

export function Header({ breadcrumbs }: HeaderProps) {
  const { auth, logout } = useAuth();
  const { isEnabled, setIsEnabled, isChatVisibleAndDocked } = useChatDock();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const {
    notifications,
    unreadCount,
    isLoading: isLoadingNotifications,
    markAsRead,
    markAllAsRead,
    remove,
  } = useNotifications();

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
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4 shadow-sm transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
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
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar..."
            className="w-full pl-9 pr-4 h-9 bg-muted/50 border-input focus:bg-background"
          />
        </div>
      </div>

      {/* Right Section: Notifications + Help + User Menu */}
      <div className="flex items-center gap-2 flex-1 justify-end">
        {/* Theme Toggle */}
        <ModeToggle />

        {/* Assistant Toggle */}
        <div className="hidden sm:flex items-center gap-2 px-2">
          <Bot
            className={`h-4 w-4 ${
              isChatVisibleAndDocked ? "text-primary" : "text-muted-foreground"
            }`}
          />
          <Switch
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
            aria-label="Mostrar/Ocultar Asistente Virtual"
          />
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notificaciones</span>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={(e) => {
                      e.preventDefault();
                      markAllAsRead();
                    }}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Marcar todas
                  </Button>
                )}
                <Badge variant="secondary">{notifications.length}</Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-y-auto">
              {isLoadingNotifications && notifications.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="sm" className="text-muted-foreground" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No hay notificaciones
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex flex-col items-start gap-1 p-3 hover:bg-accent cursor-pointer ${
                      !notification.isRead ? "bg-accent/50" : ""
                    }`}
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead(notification.id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          notification.colorClass === "blue"
                            ? "bg-blue-500"
                            : notification.colorClass === "green"
                            ? "bg-green-500"
                            : notification.colorClass === "yellow"
                            ? "bg-yellow-500"
                            : notification.colorClass === "red"
                            ? "bg-red-500"
                            : notification.colorClass === "purple"
                            ? "bg-purple-500"
                            : "bg-gray-500"
                        }`}
                      />
                      <span className="font-medium text-sm flex-1 truncate">
                        {notification.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {notification.timeAgo}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(notification.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground pl-4 line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                ))
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-sm text-primary">
              Ver todas las notificaciones
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Help */}
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-9 px-2 hover:bg-accent hover:text-accent-foreground"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src="" alt={auth?.email || "User"} />
                <AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex flex-col items-start">
                <span className="text-sm font-medium text-foreground leading-none">
                  {auth?.email?.split("@")[0] || "Usuario"}
                </span>
                <span className="text-xs text-muted-foreground leading-none mt-0.5">
                  {auth?.role || "Sin rol"}
                </span>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground hidden lg:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {auth?.email?.split("@")[0] || "Usuario"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
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
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/system" className="flex items-center">
                  <Laptop className="mr-2 h-4 w-4" />
                  <span>Sistema</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-red-600 focus:text-red-600"
            >
              {isLoggingOut && (
                <Spinner size="sm" className="mr-2 text-current" />
              )}
              <span>
                {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
