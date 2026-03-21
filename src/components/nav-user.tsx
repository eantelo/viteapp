import {
  DotsThreeVertical,
  Laptop,
  SignOut,
  Gear,
} from "@phosphor-icons/react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/Spinner";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavUser({
  email,
  role,
  onLogout,
}: {
  email?: string | null;
  role?: string | null;
  onLogout: () => Promise<void>;
}) {
  const { isMobile } = useSidebar();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const username = email?.split("@")[0] || "Usuario";
  const initials = username
    .split(".")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "U";

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground sidebar-text"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src="" alt={email || "Usuario"} />
                <AvatarFallback className="rounded-lg bg-primary/15 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight">
                <span className="sidebar-text truncate font-medium">
                  {username}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {role || "Sin rol"}
                </span>
              </div>
              <DotsThreeVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src="" alt={email || "Usuario"} />
                  <AvatarFallback className="rounded-lg bg-primary/15 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="sidebar-text truncate font-medium">
                    {username}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    {email || "usuario@ejemplo.com"}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="sidebar-text">
                <Link to="/settings">
                  <Gear />
                  <span>Configuración</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="sidebar-text">
                <Link to="/system">
                  <Laptop />
                  <span>Sistema</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="sidebar-text text-red-600 focus:text-red-600"
                disabled={isLoggingOut}
                onClick={handleLogout}
              >
                {isLoggingOut ? (
                  <Spinner size="sm" className="text-current" />
                ) : (
                  <SignOut />
                )}
                <span>{isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
