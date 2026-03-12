import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import type { SaleDto } from "@/api/salesApi";
import {
  User,
  Calendar,
  CreditCard,
  PaperPlaneTilt,
  Printer,
  X,
  Receipt,
  PencilSimple,
  SpinnerGap,
} from "@phosphor-icons/react";

interface SaleDetailModalProps {
  open: boolean;
  sale: SaleDto | null;
  onClose: () => void;
  onPrint?: (sale: SaleDto) => void;
  onEdit?: (sale: SaleDto) => void;
  onSendToTrello?: (sale: SaleDto) => void;
  isSendingToTrello?: boolean;
}

export function SaleDetailModal({
  open,
  sale,
  onClose,
  onPrint,
  onEdit,
  onSendToTrello,
  isSendingToTrello = false,
}: SaleDetailModalProps) {
  if (!sale) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getPaymentMethodName = (method: number): string => {
    const methods: Record<number, string> = {
      0: "Efectivo",
      1: "Tarjeta",
      2: "Voucher",
      3: "Transferencia",
      4: "Otro",
    };
    return methods[method] || "Desconocido";
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: "default" | "secondary" | "destructive"; label: string }
    > = {
      Completed: { variant: "default", label: "Completada" },
      Closed: { variant: "secondary", label: "Cerrada" },
      Cancelled: { variant: "destructive", label: "Cancelada" },
    };

    const config = variants[status] || {
      variant: "secondary" as const,
      label: status,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-3">
                <Receipt className="h-6 w-6 text-primary" weight="duotone" />
                Venta #{sale.saleNumber}
              </DialogTitle>
              <DialogDescription className="mt-2">
                Detalle completo de la venta
              </DialogDescription>
            </div>
            {getStatusBadge(sale.status)}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información general */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <Calendar className="h-5 w-5 text-gray-500" weight="duotone" />
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Fecha y hora
                </div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {formatDateTime(sale.date)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <User className="h-5 w-5 text-gray-500" weight="duotone" />
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Cliente
                </div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {sale.customerName || "Sin cliente"}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Productos */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Receipt className="h-5 w-5" weight="duotone" />
              Productos
            </h3>
            <div className="space-y-2">
              {sale.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {item.productName || "Producto sin nombre"}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Cantidad: {item.quantity} × {formatCurrency(item.price)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 dark:text-white">
                      {formatCurrency(item.quantity * item.price)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Pagos */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CreditCard className="h-5 w-5" weight="duotone" />
              Pagos
            </h3>
            <div className="space-y-2">
              {sale.payments.map((payment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {getPaymentMethodName(payment.method)}
                    </div>
                    {payment.reference && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Referencia: {payment.reference}
                      </div>
                    )}
                    {payment.amountReceived && payment.change && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Recibido: {formatCurrency(payment.amountReceived)} |
                        Cambio: {formatCurrency(payment.change)}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 dark:text-white">
                      {formatCurrency(payment.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Total */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 dark:bg-primary/20">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              Total
            </div>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(sale.total)}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap items-center justify-end gap-3">
            {onEdit && sale.status === "Pending" && (
              <Button
                variant="outline"
                onClick={() => onEdit(sale)}
                className="gap-2"
              >
                <PencilSimple size={18} weight="bold" />
                Editar
              </Button>
            )}
            {onSendToTrello && (
              <Button
                variant="outline"
                onClick={() => onSendToTrello(sale)}
                className="gap-2 border-sky-500/40 text-sky-600 hover:text-sky-700"
                disabled={isSendingToTrello}
              >
                {isSendingToTrello ? (
                  <SpinnerGap size={18} weight="bold" className="animate-spin" />
                ) : (
                  <PaperPlaneTilt size={18} weight="bold" />
                )}
                {isSendingToTrello ? "Enviando a Trello..." : "Enviar a Trello"}
              </Button>
            )}
            {onPrint && (
              <Button
                variant="outline"
                onClick={() => onPrint(sale)}
                className="gap-2"
              >
                <Printer size={18} weight="bold" />
                Reimprimir
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="gap-2">
              <X size={18} weight="bold" />
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
