import { useMemo, useState, useRef, useEffect } from "react";
import {
  IconUser,
  IconMailbox,
  IconPhone,
  IconCalendar,
  IconMoneybag,
  IconGift,
  IconAlertTriangle,
  IconDots,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { CustomerDto } from "@/api/customersApi";

interface CustomerCardProps {
  customer: CustomerDto | null;
  onViewHistory?: () => void;
  onEdit?: () => void;
  onViewDebt?: () => void;
  onRemove?: () => void;
  isGeneric?: boolean;
  formatCurrency?: (value: number) => string;
  className?: string;
}

// Componente interno para dropdown accesible con navegación por flechas
const AccessibleActionDropdown = ({
  hasPendingDebt,
  onViewHistory,
  onEdit,
  onViewDebt,
  onRemove,
}: {
  hasPendingDebt: boolean;
  onViewHistory?: () => void;
  onEdit?: () => void;
  onViewDebt?: () => void;
  onRemove?: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Construir array de acciones disponibles
  const actions = [
    onViewHistory && {
      label: "Ver historial completo",
      icon: IconCalendar,
      onClick: onViewHistory,
    },
    onEdit && {
      label: "Editar información",
      icon: IconUser,
      onClick: onEdit,
    },
    hasPendingDebt &&
      onViewDebt && {
        label: "Ver deuda pendiente",
        icon: IconAlertTriangle,
        onClick: onViewDebt,
        isDanger: true,
      },
    onRemove && {
      label: "Deseleccionar",
      icon: IconUser,
      onClick: onRemove,
      isDanger: true,
    },
  ].filter(Boolean) as Array<{
    label: string;
    icon: React.ElementType;
    onClick: () => void;
    isDanger?: boolean;
  }>;

  // Manejar teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % actions.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev === 0 ? actions.length - 1 : prev - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          actions[selectedIndex].onClick();
          setIsOpen(false);
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          buttonRef.current?.focus();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, actions]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener("mousedown", handleClickOutside);
      return () => window.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Resetear índice al abrir
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (actions.length === 0) return null;

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="opacity-0 hover:opacity-100 transition-opacity focus-visible:opacity-100"
        aria-label="Opciones del cliente"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <IconDots className="size-4" />
      </Button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 w-48 py-1"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="actions-menu"
        >
          {actions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors",
                  "hover:bg-slate-100 dark:hover:bg-slate-800",
                  selectedIndex === index &&
                    "bg-slate-100 dark:bg-slate-800 outline-2 outline-offset-0 outline-primary",
                  action.isDanger && "text-destructive hover:bg-destructive/10"
                )}
                role="menuitem"
                tabIndex={selectedIndex === index ? 0 : -1}
              >
                <IconComponent className="size-4 shrink-0" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const CustomerCard = ({
  customer,
  onViewHistory,
  onEdit,
  onViewDebt,
  onRemove,
  isGeneric = false,
  formatCurrency = (value) => `$${value.toFixed(2)}`,
  className,
}: CustomerCardProps) => {
  const hasPendingDebt = useMemo(
    () =>
      customer &&
      customer.pendingDebt !== undefined &&
      customer.pendingDebt > 0,
    [customer]
  );

  if (!customer) {
    return (
      <div
        className={cn(
          "rounded-lg border border-dashed p-4 text-center",
          className
        )}
      >
        <IconUser className="size-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm font-medium text-muted-foreground">
          {isGeneric
            ? "Cliente genérico/Sin cliente"
            : "Sin cliente seleccionado"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {isGeneric
            ? "Venta rápida sin identificación"
            : "Busca o crea un cliente para continuar"}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-card shadow-sm overflow-hidden",
        className
      )}
    >
      {/* Header con avatar y acciones */}
      <div className="bg-linear-to-r from-primary/5 to-primary/0 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="size-10 bg-primary text-white shrink-0">
              <AvatarFallback>
                {customer.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                {customer.name}
              </h3>
              {customer.email && (
                <p className="text-xs text-muted-foreground truncate">
                  {customer.email}
                </p>
              )}
            </div>
          </div>
          <AccessibleActionDropdown
            hasPendingDebt={hasPendingDebt || false}
            onViewHistory={onViewHistory}
            onEdit={onEdit}
            onViewDebt={onViewDebt}
            onRemove={onRemove}
          />
        </div>
      </div>

      {/* Datos de contacto */}
      <div className="p-4 space-y-3">
        {(customer.phone || customer.address) && (
          <div className="space-y-2">
            {customer.phone && (
              <div className="flex items-center gap-2 text-sm">
                <IconPhone className="size-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground truncate">
                  {customer.phone}
                </span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-2 text-sm">
                <IconMailbox className="size-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground truncate">
                  {customer.address}
                </span>
              </div>
            )}
          </div>
        )}

        <Separator className="my-3" />

        {/* Estadísticas */}
        <div className="grid grid-cols-2 gap-3">
          {/* Última compra */}
          {customer.lastPurchaseDate && (
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/30 p-3">
              <div className="flex items-center gap-2 mb-1">
                <IconCalendar className="size-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">
                  Última compra
                </span>
              </div>
              <div className="text-sm font-semibold">
                {new Date(customer.lastPurchaseDate).toLocaleDateString(
                  "es-MX",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }
                )}
              </div>
              {customer.lastPurchaseAmount !== undefined && (
                <div className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(customer.lastPurchaseAmount)}
                </div>
              )}
            </div>
          )}

          {/* Total de compras */}
          {customer.totalPurchases !== undefined &&
            customer.totalPurchases > 0 && (
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900/30 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <IconMoneybag className="size-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">
                    Total de compras
                  </span>
                </div>
                <div className="text-sm font-semibold">
                  {customer.totalPurchases}{" "}
                  {customer.totalPurchases === 1 ? "compra" : "compras"}
                </div>
                {customer.totalPurchases > 0 && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    Cliente recurrente
                  </Badge>
                )}
              </div>
            )}

          {/* Puntos de fidelidad */}
          {customer.loyaltyPoints !== undefined &&
            customer.loyaltyPoints > 0 && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <IconGift className="size-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                    Puntos
                  </span>
                </div>
                <div className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  {customer.loyaltyPoints}
                </div>
              </div>
            )}

          {/* Deuda pendiente */}
          {hasPendingDebt && (
            <div className="rounded-lg bg-destructive/10 p-3">
              <div className="flex items-center gap-2 mb-1">
                <IconAlertTriangle className="size-3.5 text-destructive" />
                <span className="text-xs text-destructive font-medium">
                  Deuda
                </span>
              </div>
              <div className="text-sm font-semibold text-destructive">
                {formatCurrency(customer.pendingDebt!)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
