import { useMemo } from "react";
import {
  IconCalendar,
  IconMoneybag,
  IconGift,
  IconAlertTriangle,
  IconX,
} from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { CustomerDto } from "@/api/customersApi";

interface CustomerDetailModalProps {
  open: boolean;
  customer: CustomerDto | null;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  formatCurrency?: (value: number) => string;
}

export function CustomerDetailModal({
  open,
  customer,
  onOpenChange,
  onEdit,
  formatCurrency = (value) => `$${value.toFixed(2)}`,
}: CustomerDetailModalProps) {
  const lastPurchaseDaysAgo = useMemo(() => {
    if (!customer?.lastPurchaseDate) return null;
    const lastDate = new Date(customer.lastPurchaseDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [customer?.lastPurchaseDate]);

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Detalle del cliente</DialogTitle>
          <DialogDescription>
            Información completa y historial de {customer.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Información de contacto */}
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              Información de contacto
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground">Nombre</p>
                <p className="font-medium">{customer.name}</p>
              </div>
              {customer.email && (
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{customer.email}</p>
                </div>
              )}
              {customer.phone && (
                <div>
                  <p className="text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{customer.phone}</p>
                </div>
              )}
              {customer.address && (
                <div>
                  <p className="text-muted-foreground">Dirección</p>
                  <p className="font-medium">{customer.address}</p>
                </div>
              )}
              {customer.taxId && (
                <div>
                  <p className="text-muted-foreground">RFC / Tax ID</p>
                  <p className="font-medium">{customer.taxId}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Estadísticas de compra */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Historial de compras</h3>
            <div className="grid grid-cols-2 gap-3">
              {/* Última compra */}
              {customer.lastPurchaseDate ? (
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <IconCalendar className="size-4 text-muted-foreground" />
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
                  {lastPurchaseDaysAgo && (
                    <p className="text-xs text-muted-foreground mt-1">
                      hace {lastPurchaseDaysAgo} día
                      {lastPurchaseDaysAgo === 1 ? "" : "s"}
                    </p>
                  )}
                  {customer.lastPurchaseAmount !== undefined && (
                    <p className="text-sm font-medium text-primary mt-2">
                      {formatCurrency(customer.lastPurchaseAmount)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    Sin registro de compras
                  </p>
                </div>
              )}

              {/* Total de compras */}
              {customer.totalPurchases !== undefined && (
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <IconMoneybag className="size-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">
                      Total de compras
                    </span>
                  </div>
                  <div className="text-sm font-semibold">
                    {customer.totalPurchases}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    transacciones
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Fidelización y deuda */}
          <div className="grid grid-cols-2 gap-3">
            {/* Puntos de fidelidad */}
            {customer.loyaltyPoints !== undefined &&
              customer.loyaltyPoints > 0 && (
                <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-900/20 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <IconGift className="size-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                      Puntos de fidelidad
                    </span>
                  </div>
                  <div className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                    {customer.loyaltyPoints}
                  </div>
                  <Badge variant="outline" className="mt-2 text-xs">
                    Activos
                  </Badge>
                </div>
              )}

            {/* Deuda pendiente */}
            {customer.pendingDebt !== undefined && customer.pendingDebt > 0 && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <IconAlertTriangle className="size-4 text-destructive" />
                  <span className="text-xs text-destructive font-medium">
                    Deuda pendiente
                  </span>
                </div>
                <div className="text-lg font-semibold text-destructive">
                  {formatCurrency(customer.pendingDebt)}
                </div>
                <p className="text-xs text-destructive/70 mt-1">
                  Requiere pago
                </p>
              </div>
            )}
          </div>

          {/* Si no hay puntos ni deuda pero hay otros datos */}
          {(!customer.loyaltyPoints || customer.loyaltyPoints === 0) &&
            (!customer.pendingDebt || customer.pendingDebt === 0) &&
            customer.totalPurchases !== undefined &&
            customer.totalPurchases > 0 && (
              <div className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20 p-3">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-800"
                  >
                    Sin deuda
                  </Badge>
                  <p className="text-sm text-green-800 dark:text-green-300">
                    Cliente al corriente
                  </p>
                </div>
              </div>
            )}
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <IconX className="size-4 mr-2" />
            Cerrar
          </Button>
          {onEdit && <Button onClick={onEdit}>Editar información</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
