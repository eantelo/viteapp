import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/layout/Header";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

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
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-slate-50 dark:bg-muted/10">
        <Header breadcrumbs={breadcrumbs} />
        <main className={cn("flex flex-1 flex-col gap-4 p-4 pt-0", className)}>
          {children}
        </main>
        <ChatWidget />
      </SidebarInset>
    </SidebarProvider>
  );
}
