import { useState } from "react";
import {
  IconCash,
  IconCreditCard,
  IconReceipt,
  IconBuildingBank,
  IconDots,
} from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/Spinner";
import { PaymentMethod, type PaymentMethodType } from "@/api/salesApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirm: (
    paymentMethod: PaymentMethodType,
    amountReceived: number,
    reference: string
  ) => Promise<void>;
  isSubmitting: boolean;
}

export function PaymentDialog({
  open,
  onOpenChange,
  total,
  onConfirm,
  isSubmitting,
}: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>(
    PaymentMethod.Cash
  );
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [paymentReference, setPaymentReference] = useState<string>("");

  const change =
    paymentMethod === PaymentMethod.Cash && amountReceived > 0
      ? Math.max(0, Number((amountReceived - total).toFixed(2)))
      : 0;

  const isValid =
    paymentMethod !== PaymentMethod.Cash || amountReceived >= total;

  const handleConfirm = async () => {
    if (!isValid) return;

    try {
      await onConfirm(paymentMethod, amountReceived, paymentReference);
      // Reset form on success
      setPaymentMethod(PaymentMethod.Cash);
      setAmountReceived(0);
      setPaymentReference("");
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      // Reset form when closing
      setPaymentMethod(PaymentMethod.Cash);
      setAmountReceived(0);
      setPaymentReference("");
    }
    onOpenChange(newOpen);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Procesar Pago</DialogTitle>
          <DialogDescription>
            Selecciona el método de pago y confirma la transacción.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Total Amount */}
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/30">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total a cobrar</p>
              <p className="text-2xl font-bold">{formatCurrency(total)}</p>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment-method">Método de pago</Label>
            <Select
              value={paymentMethod.toString()}
              onValueChange={(value) =>
                setPaymentMethod(Number(value) as PaymentMethodType)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PaymentMethod.Cash.toString()}>
                  <div className="flex items-center gap-2">
                    <IconCash className="size-4" />
                    Efectivo
                  </div>
                </SelectItem>
                <SelectItem value={PaymentMethod.Card.toString()}>
                  <div className="flex items-center gap-2">
                    <IconCreditCard className="size-4" />
                    Tarjeta
                  </div>
                </SelectItem>
                <SelectItem value={PaymentMethod.Voucher.toString()}>
                  <div className="flex items-center gap-2">
                    <IconReceipt className="size-4" />
                    Vale
                  </div>
                </SelectItem>
                <SelectItem value={PaymentMethod.Transfer.toString()}>
                  <div className="flex items-center gap-2">
                    <IconBuildingBank className="size-4" />
                    Transferencia
                  </div>
                </SelectItem>
                <SelectItem value={PaymentMethod.Other.toString()}>
                  <div className="flex items-center gap-2">
                    <IconDots className="size-4" />
                    Otro
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount Received (Cash only) */}
          {paymentMethod === PaymentMethod.Cash && (
            <div className="space-y-2">
              <Label htmlFor="amount-received">Monto recibido</Label>
              <Input
                id="amount-received"
                type="number"
                min={total.toString()}
                step="0.01"
                value={amountReceived === 0 ? "" : amountReceived.toString()}
                onChange={(event) => {
                  const value = event.target.value;
                  setAmountReceived(value ? Number(value) : 0);
                }}
                placeholder={total.toString()}
                className="h-9"
              />
              {amountReceived > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cambio</span>
                  <span
                    className={`font-semibold ${
                      change > 0 ? "text-green-600" : "text-muted-foreground"
                    }`}
                  >
                    {formatCurrency(change)}
                  </span>
                </div>
              )}
              {amountReceived > 0 && amountReceived < total && (
                <p className="text-sm text-destructive">
                  El monto recibido debe ser mayor o igual al total
                </p>
              )}
            </div>
          )}

          {/* Payment Reference */}
          <div className="space-y-2">
            <Label htmlFor="payment-reference">
              Referencia{" "}
              {paymentMethod === PaymentMethod.Cash ? "(opcional)" : ""}
            </Label>
            <Input
              id="payment-reference"
              value={paymentReference}
              onChange={(event) => setPaymentReference(event.target.value)}
              placeholder={
                paymentMethod === PaymentMethod.Card
                  ? "Últimos 4 dígitos"
                  : paymentMethod === PaymentMethod.Transfer
                  ? "Número de referencia"
                  : paymentMethod === PaymentMethod.Voucher
                  ? "Código del vale"
                  : "Referencia del pago"
              }
              className="h-9"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid || isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Procesando...
              </>
            ) : (
              <>
                {paymentMethod === PaymentMethod.Cash && change > 0
                  ? `Confirmar y dar ${formatCurrency(change)}`
                  : `Confirmar ${formatCurrency(total)}`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
