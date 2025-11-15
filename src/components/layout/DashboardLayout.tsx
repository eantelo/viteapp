import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
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
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface DashboardLayoutProps {
  /**
   * Breadcrumb items. El último item se muestra como página actual (sin link).
   */
  breadcrumbs: BreadcrumbItem[];
  /**
   * Contenido principal de la página
   */
  children: ReactNode;
  /**
   * Clase CSS adicional para el contenedor principal
   */
  className?: string;
}

/**
 * Layout compartido para todas las páginas protegidas del dashboard.
 * Incluye sidebar, header con breadcrumbs, información de usuario y botón de logout.
 */
export function DashboardLayout({
  breadcrumbs,
  children,
  className,
}: DashboardLayoutProps) {
  const { auth, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }
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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-slate-50">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
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
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">
                {auth?.email ?? "—"}
              </p>
              <p className="text-xs text-slate-500">
                Rol <Badge variant="outline">{auth?.role ?? "Sin rol"}</Badge>
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut && <Spinner size="sm" className="text-current" />}
              {isLoggingOut ? "Cerrando..." : "Cerrar sesión"}
            </Button>
          </div>
        </header>
        <div className={className}>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
