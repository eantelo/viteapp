import { useState } from "react";
import {
  Money,
  CreditCard,
  Receipt,
  Bank,
  DotsThree,
} from "@phosphor-icons/react";
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
import { Switch } from "@/components/ui/switch";
import { PaymentMethod, type PaymentMethodType } from "@/api/salesApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface PaymentConfirmation {
  paymentMethod: PaymentMethodType;
  amount: number;
  amountReceived?: number;
  reference: string;
  creditDueDate?: string;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirm: (confirmation: PaymentConfirmation) => Promise<void>;
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
  const [isCredit, setIsCredit] = useState(false);
  const [initialPayment, setInitialPayment] = useState<number>(0);
  const [creditDueDate, setCreditDueDate] = useState(() => {
    const due = new Date();
    due.setDate(due.getDate() + 30);
    return due.toISOString().slice(0, 10);
  });

  const amountToApply = isCredit ? initialPayment : total;

  const change =
    paymentMethod === PaymentMethod.Cash && amountReceived > 0
      ? Math.max(0, Number((amountReceived - amountToApply).toFixed(2)))
      : 0;

  const isValid =
    isCredit
      ? initialPayment >= 0 && initialPayment < total && !!creditDueDate &&
        (paymentMethod !== PaymentMethod.Cash || initialPayment === 0 || amountReceived >= initialPayment)
      : paymentMethod !== PaymentMethod.Cash || amountReceived >= total;

  const handleConfirm = async () => {
    if (!isValid) return;

    try {
      await onConfirm({
        paymentMethod,
        amount: amountToApply,
        amountReceived: paymentMethod === PaymentMethod.Cash && amountToApply > 0 ? amountReceived : undefined,
        reference: paymentReference,
        creditDueDate: isCredit ? creditDueDate : undefined,
      });
      // Reset form on success
      setPaymentMethod(PaymentMethod.Cash);
      setAmountReceived(0);
      setPaymentReference("");
      setIsCredit(false);
      setInitialPayment(0);
      onOpenChange(false);
    } catch {
      // Error handling is done in the parent component
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      // Reset form when closing
      setPaymentMethod(PaymentMethod.Cash);
      setAmountReceived(0);
      setPaymentReference("");
      setIsCredit(false);
      setInitialPayment(0);
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

          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label htmlFor="credit-sale">Venta a crédito</Label>
                <p className="text-xs text-muted-foreground">Registra el saldo en cuentas por cobrar.</p>
              </div>
              <Switch id="credit-sale" checked={isCredit} onCheckedChange={setIsCredit} />
            </div>
            {isCredit && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="initial-payment">Anticipo</Label>
                  <Input id="initial-payment" type="number" min="0" max={total} step="0.01"
                    value={initialPayment === 0 ? "" : initialPayment.toString()}
                    onChange={(event) => setInitialPayment(event.target.value ? Number(event.target.value) : 0)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="credit-due-date">Vence el</Label>
                  <Input id="credit-due-date" type="date" value={creditDueDate}
                    onChange={(event) => setCreditDueDate(event.target.value)} />
                </div>
              </div>
            )}
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
                    <Money className="size-4" weight="bold" />
                    Efectivo
                  </div>
                </SelectItem>
                <SelectItem value={PaymentMethod.Card.toString()}>
                  <div className="flex items-center gap-2">
                    <CreditCard className="size-4" weight="bold" />
                    Tarjeta
                  </div>
                </SelectItem>
                <SelectItem value={PaymentMethod.Voucher.toString()}>
                  <div className="flex items-center gap-2">
                    <Receipt className="size-4" weight="bold" />
                    Vale
                  </div>
                </SelectItem>
                <SelectItem value={PaymentMethod.Transfer.toString()}>
                  <div className="flex items-center gap-2">
                    <Bank className="size-4" weight="bold" />
                    Transferencia
                  </div>
                </SelectItem>
                <SelectItem value={PaymentMethod.Other.toString()}>
                  <div className="flex items-center gap-2">
                    <DotsThree className="size-4" weight="bold" />
                    Otro
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount Received (Cash only) */}
          {paymentMethod === PaymentMethod.Cash && (!isCredit || initialPayment > 0) && (
            <div className="space-y-2">
              <Label htmlFor="amount-received">Monto recibido</Label>
              <Input
                id="amount-received"
                type="number"
                min={amountToApply.toString()}
                step="0.01"
                value={amountReceived === 0 ? "" : amountReceived.toString()}
                onChange={(event) => {
                  const value = event.target.value;
                  setAmountReceived(value ? Number(value) : 0);
                }}
                placeholder={amountToApply.toString()}
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
              {amountReceived > 0 && amountReceived < amountToApply && (
                <p className="text-sm text-destructive">
                  El monto recibido debe ser mayor o igual al abono
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
                  : isCredit
                  ? `Registrar crédito ${formatCurrency(total - initialPayment)}`
                  : `Confirmar ${formatCurrency(total)}`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
