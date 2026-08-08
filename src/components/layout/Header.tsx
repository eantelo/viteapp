import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Robot,
  Check,
  CaretDown,
  Laptop,
  MagnifyingGlass,
  Gear,
  ShieldCheck,
  Trash,
} from "@phosphor-icons/react";
import { useGlobalSearchShortcut } from "@/hooks/useGlobalSearchShortcut";
import { GlobalSearchDialog } from "@/components/GlobalSearchDialog";
import { useAuth } from "@/context/AuthContext";
import { useChatDock } from "@/contexts/ChatDockContext";
import { useNotifications } from "@/hooks/useNotifications";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/Spinner";
import { Switch } from "@/components/ui/switch";
import { ModeToggle } from "@/components/mode-toggle";
import type { BreadcrumbItem as BreadcrumbItemType } from "./DashboardLayout";
import { useCurrency } from "@/contexts/CurrencyContext";

interface HeaderProps {
  breadcrumbs: BreadcrumbItemType[];
}

export function Header({ breadcrumbs }: HeaderProps) {
  const { auth, logout } = useAuth();
  const { configuration, displayCurrencyCode, setDisplayCurrencyCode, isLoading: isLoadingCurrencies } = useCurrency();
  const { isEnabled, setIsEnabled, isChatVisibleAndDocked } = useChatDock();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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

  // Handle opening search dialog
  const handleSearchClick = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  // Register global Ctrl+K shortcut
  useGlobalSearchShortcut({
    onTrigger: () => setIsSearchOpen(true),
  });

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
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/70 bg-background/90 px-2 shadow-sm backdrop-blur-md transition-[width,height] supports-[backdrop-filter]:bg-background/75 sm:h-16 sm:gap-4 sm:px-4 group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
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
                    <BreadcrumbLink asChild>
                      <Link to={item.href}>{item.label}</Link>
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

      {/* Center Section: Search Button (hidden on mobile) */}
      <div className="hidden lg:flex items-center flex-1 max-w-md">
        <button
          type="button"
          onClick={handleSearchClick}
          className="relative flex h-9 w-full items-center gap-2 rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Abrir búsqueda global"
        >
          <MagnifyingGlass
            className="h-4 w-4"
            weight="bold"
            aria-hidden="true"
          />
          <span className="flex-1 text-left">Buscar…</span>
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Global Search Dialog */}
      <GlobalSearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />

      {/* Right Section: Notifications + Help + User Menu */}
      <div className="flex items-center gap-2 flex-1 justify-end">
        {configuration && (
          <label className="flex items-center gap-2 text-xs text-muted-foreground" title="Cambia la moneda de visualización en reportes compatibles">
            <span className="hidden xl:inline">Ver en</span>
            <select
              name="displayCurrencyCode"
              className="h-9 max-w-28 rounded-md border border-input bg-background px-2 text-sm font-medium text-foreground outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:max-w-44"
              value={displayCurrencyCode}
              onChange={(event) => setDisplayCurrencyCode(event.target.value)}
              aria-label="Moneda de visualización"
              disabled={isLoadingCurrencies}
            >
              {configuration.enabledCurrencies
                .filter((currency) => currency.isEnabled)
                .map((currency) => (
                  <option key={currency.currencyCode} value={currency.currencyCode}>
                    {currency.currencyCode}{currency.currencyCode === configuration.accountingCurrencyCode ? " · contable" : ` · ${currency.name}`}
                  </option>
                ))}
            </select>
          </label>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 lg:hidden"
          onClick={handleSearchClick}
          aria-label="Abrir búsqueda global"
          title="Buscar"
        >
          <MagnifyingGlass
            className="h-4 w-4"
            weight="bold"
            aria-hidden="true"
          />
        </Button>

        {/* Theme Toggle */}
        <ModeToggle />

        <Button
          variant="ghost"
          size="icon"
          className={`h-9 w-9 md:hidden ${
            isEnabled
              ? "bg-primary/10 text-primary hover:bg-primary/15"
              : "text-muted-foreground"
          }`}
          onClick={() => setIsEnabled(!isEnabled)}
          aria-label={
            isEnabled ? "Ocultar asistente virtual" : "Mostrar asistente virtual"
          }
          title={
            isEnabled ? "Ocultar asistente virtual" : "Mostrar asistente virtual"
          }
        >
          <Robot
            className="h-4 w-4"
            weight="bold"
            aria-hidden="true"
          />
        </Button>

        {/* Assistant Toggle */}
        <div className="hidden md:flex items-center gap-2 px-2">
          <Robot
            className={`h-4 w-4 ${
              isChatVisibleAndDocked ? "text-primary" : "text-muted-foreground"
            }`}
            weight="bold"
            aria-hidden="true"
          />
          <Switch
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
            aria-label="Mostrar u ocultar el asistente virtual"
          />
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9"
              aria-label={
                unreadCount > 0
                  ? `Notificaciones, ${unreadCount} sin leer`
                  : "Notificaciones"
              }
            >
              <Bell
                className="h-4 w-4 text-muted-foreground"
                weight="bold"
                aria-hidden="true"
              />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
                  aria-hidden="true"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-[min(22rem,calc(100vw-1rem))]"
          >
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
                    <Check
                      className="h-3 w-3 mr-1"
                      weight="bold"
                      aria-hidden="true"
                    />
                    Marcar todas
                  </Button>
                )}
                <Badge variant="secondary">{notifications.length}</Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-y-auto">
              {isLoadingNotifications && notifications.length === 0 ? (
                <div
                  className="flex items-center justify-center gap-2 py-8"
                  role="status"
                  aria-live="polite"
                >
                  <Spinner size="sm" className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Cargando…
                  </span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" weight="duotone" />
                  <p className="text-sm text-muted-foreground">
                    No hay notificaciones
                  </p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const content = (
                    <>
                      <div className="flex w-full items-center gap-2 pr-8">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
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
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {notification.title}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {notification.timeAgo}
                        </span>
                      </div>
                      <p className="line-clamp-2 pl-4 pr-8 text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                    </>
                  );

                  return (
                    <div
                      key={notification.id}
                      className={`group relative flex items-start gap-1 p-3 transition-colors hover:bg-accent ${
                        !notification.isRead ? "bg-accent/50" : ""
                      }`}
                    >
                      {notification.isRead ? (
                        <div className="min-w-0 flex-1">{content}</div>
                      ) : (
                        <button
                          type="button"
                          className="min-w-0 flex-1 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                          onClick={() => markAsRead(notification.id)}
                          aria-label={`Marcar como leída: ${notification.title}`}
                        >
                          {content}
                        </button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                        onClick={() => remove(notification.id)}
                        aria-label={`Eliminar notificación: ${notification.title}`}
                      >
                        <Trash
                          className="h-3.5 w-3.5 text-muted-foreground"
                          weight="bold"
                          aria-hidden="true"
                        />
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-9 px-2 hover:bg-accent hover:text-accent-foreground"
              aria-label="Abrir menú de usuario"
            >
              <Avatar className="h-7 w-7">
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
              <CaretDown className="h-3 w-3 text-muted-foreground hidden lg:block" weight="bold" />
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
              <DropdownMenuItem asChild>
                <Link to="/account/security" className="flex items-center">
                  <ShieldCheck className="mr-2 h-4 w-4" weight="bold" />
                  <span>Seguridad</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center">
                  <Gear className="mr-2 h-4 w-4" weight="bold" />
                  <span>Configuración</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/system" className="flex items-center">
                  <Laptop className="mr-2 h-4 w-4" weight="bold" />
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
                {isLoggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
