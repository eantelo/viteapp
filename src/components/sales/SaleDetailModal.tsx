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
  IconUser,
  IconCalendar,
  IconCreditCard,
  IconPrinter,
  IconX,
  IconReceipt,
  IconPencil,
} from "@tabler/icons-react";

interface SaleDetailModalProps {
  open: boolean;
  sale: SaleDto | null;
  onClose: () => void;
  onPrint?: (sale: SaleDto) => void;
  onEdit?: (sale: SaleDto) => void;
}

export function SaleDetailModal({
  open,
  sale,
  onClose,
  onPrint,
  onEdit,
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
                <IconReceipt className="h-6 w-6 text-primary" />
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
              <IconCalendar className="h-5 w-5 text-gray-500" />
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
              <IconUser className="h-5 w-5 text-gray-500" />
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
              <IconReceipt className="h-5 w-5" />
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
              <IconCreditCard className="h-5 w-5" />
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
          <div className="flex items-center justify-end gap-3">
            {onEdit && sale.status === "Pending" && (
              <Button
                variant="outline"
                onClick={() => onEdit(sale)}
                className="gap-2"
              >
                <IconPencil size={18} />
                Editar
              </Button>
            )}
            {onPrint && (
              <Button
                variant="outline"
                onClick={() => onPrint(sale)}
                className="gap-2"
              >
                <IconPrinter size={18} />
                Reimprimir
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="gap-2">
              <IconX size={18} />
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
