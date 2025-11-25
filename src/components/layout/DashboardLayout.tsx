import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/layout/Header";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ChatDockProvider, useChatDock } from "@/contexts/ChatDockContext";

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

function DashboardLayoutContent({
  breadcrumbs,
  children,
  className,
}: DashboardLayoutProps) {
  const { isChatVisibleAndDocked, chatWidth } = useChatDock();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset
        className={cn("flex flex-col bg-slate-50 dark:bg-muted/10")}
      >
        {/* Header spans full width, not affected by chat panel */}
        <Header breadcrumbs={breadcrumbs} />
        {/* Main content area adjusts for docked chat */}
        <main
          className={cn(
            "flex-1 flex flex-col gap-4 p-4 overflow-auto transition-all duration-300",
            className
          )}
          style={{
            paddingRight: isChatVisibleAndDocked
              ? `${chatWidth + 16}px`
              : undefined,
          }}
        >
          {children}
        </main>
        <ChatWidget />
      </SidebarInset>
    </SidebarProvider>
  );
}

/**
 * Layout compartido para todas las páginas protegidas del dashboard.
 * Incluye sidebar, header con breadcrumbs, información de usuario y botón de logout.
 */
export function DashboardLayout(props: DashboardLayoutProps) {
  return (
    <ChatDockProvider>
      <DashboardLayoutContent {...props} />
    </ChatDockProvider>
  );
}
