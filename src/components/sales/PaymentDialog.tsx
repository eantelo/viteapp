import { useEffect, useMemo, useState } from "react";
import { Plus, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import { getCurrencyQuote } from "@/api/currenciesApi";
import { PaymentMethod, type PaymentMethodType } from "@/api/salesApi";
import type { ApiError } from "@/api/apiClient";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/Spinner";
import { Switch } from "@/components/ui/switch";

export interface PaymentLineConfirmation {
  paymentMethod: PaymentMethodType;
  currencyCode: string;
  amount: number;
  amountReceived?: number;
  reference: string;
  exchangeRateId?: string | null;
  appliedAmount: number;
}

export interface PaymentConfirmation {
  payments: PaymentLineConfirmation[];
  creditDueDate?: string;
}

interface PaymentLineState extends PaymentLineConfirmation {
  key: string;
  quoting: boolean;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  saleCurrencyCode?: string;
  onConfirm: (confirmation: PaymentConfirmation) => Promise<void>;
  onQuoteStale: () => Promise<void>;
  isSubmitting: boolean;
}

const newLine = (currencyCode: string, amount: number): PaymentLineState => ({
  key: crypto.randomUUID(),
  paymentMethod: PaymentMethod.Cash,
  currencyCode,
  amount,
  amountReceived: amount,
  reference: "",
  exchangeRateId: null,
  appliedAmount: amount,
  quoting: false,
});

export function PaymentDialog({
  open,
  onOpenChange,
  total,
  saleCurrencyCode: requestedSaleCurrencyCode,
  onConfirm,
  onQuoteStale,
  isSubmitting,
}: PaymentDialogProps) {
  const { configuration, formatCurrency } = useCurrency();
  const saleCurrencyCode = requestedSaleCurrencyCode
    ?? configuration?.defaultCurrencyCode
    ?? configuration?.accountingCurrencyCode
    ?? "USD";
  const [payments, setPayments] = useState<PaymentLineState[]>(() => [newLine(saleCurrencyCode, total)]);
  const [isCredit, setIsCredit] = useState(false);
  const [creditDueDate, setCreditDueDate] = useState(() => {
    const due = new Date();
    due.setDate(due.getDate() + 30);
    return due.toISOString().slice(0, 10);
  });

  const appliedTotal = useMemo(() => payments.reduce((sum, item) => sum + item.appliedAmount, 0), [payments]);
  const remaining = Number(Math.max(0, total - appliedTotal).toFixed(6));
  const overpayment = appliedTotal - total > 0.000001;
  const hasUnavailableQuote = payments.some((item) => item.quoting || !Number.isFinite(item.appliedAmount));
  const valid = !hasUnavailableQuote && !overpayment && (isCredit ? remaining > 0 : remaining <= 0.000001);

  useEffect(() => {
    // El diálogo inicia una sesión de cobro nueva cada vez que cambia la venta visible.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setPayments([newLine(saleCurrencyCode, total)]);
  }, [open, saleCurrencyCode, total]);

  const quoteLine = async (key: string, patch: Partial<PaymentLineState>) => {
    const current = payments.find((item) => item.key === key);
    if (!current) return;
    const next = { ...current, ...patch, quoting: true };
    setPayments((items) => items.map((item) => item.key === key ? next : item));
    try {
      const quote = await getCurrencyQuote(next.currencyCode, saleCurrencyCode, next.amount);
      setPayments((items) => items.map((item) => item.key === key ? {
        ...next,
        appliedAmount: quote.convertedAmount ?? Number.NaN,
        exchangeRateId: quote.fromExchangeRateId,
        quoting: false,
      } : item));
    } catch (error) {
      setPayments((items) => items.map((item) => item.key === key ? { ...next, appliedAmount: Number.NaN, quoting: false } : item));
      toast.error(error instanceof Error ? error.message : "Conversión no disponible");
    }
  };

  const addPayment = () => {
    const amount = remaining;
    setPayments((items) => [...items, newLine(saleCurrencyCode, amount)]);
  };

  const confirm = async () => {
    if (!valid) return;
    try {
      await onConfirm({
        payments: payments.filter((item) => item.amount > 0).map(({ key: _key, quoting: _quoting, ...item }) => item),
        creditDueDate: isCredit ? creditDueDate : undefined,
      });
      onOpenChange(false);
    } catch (error) {
      const apiError = error as ApiError;
      const details = apiError.details as { code?: string } | undefined;
      if (apiError.status === 409 && details?.code === "currency_quote_stale") {
        toast.warning("La cotización cambió. Se recalcularon los pagos; revise y confirme nuevamente.");
        await onQuoteStale();
        await Promise.all(payments.map((item) => quoteLine(item.key, {})));
        return;
      }
      toast.error(error instanceof Error ? error.message : "No se pudo procesar la venta.");
      throw error;
    }
  };

  const enabledCurrencies = configuration?.enabledCurrencies.filter((currency) => currency.isEnabled) ?? [];

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Procesar pago multimoneda</DialogTitle>
          <DialogDescription>Cada medio de pago conserva su moneda, cotización, equivalente aplicado y cambio.</DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-muted p-4 text-center">
          <div className="text-sm text-muted-foreground">Total de la venta</div>
          <div className="text-2xl font-bold">{formatCurrency(total, saleCurrencyCode)}</div>
          <div className="text-sm text-muted-foreground">Saldo: {formatCurrency(remaining, saleCurrencyCode)}</div>
        </div>

        <div className="space-y-3">
          {payments.map((payment, index) => (
            <div key={payment.key} className="grid gap-3 rounded-lg border p-3 md:grid-cols-6">
              <div className="space-y-1 md:col-span-1">
                <Label>Método</Label>
                <select className="h-9 w-full rounded-md border bg-background px-2" value={payment.paymentMethod}
                  onChange={(event) => setPayments((items) => items.map((item) => item.key === payment.key ? { ...item, paymentMethod: Number(event.target.value) as PaymentMethodType } : item))}>
                  <option value={PaymentMethod.Cash}>Efectivo</option><option value={PaymentMethod.Card}>Tarjeta</option>
                  <option value={PaymentMethod.Transfer}>Transferencia</option><option value={PaymentMethod.Voucher}>Vale</option>
                  <option value={PaymentMethod.Other}>Otro</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Moneda</Label>
                <select className="h-9 w-full rounded-md border bg-background px-2" value={payment.currencyCode}
                  onChange={(event) => void quoteLine(payment.key, { currencyCode: event.target.value })}>
                  {enabledCurrencies.map((currency) => <option key={currency.currencyCode}>{currency.currencyCode}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Entregado</Label>
                <Input type="number" min="0" step="0.000001" value={payment.amount || ""}
                  onChange={(event) => void quoteLine(payment.key, { amount: Number(event.target.value) || 0 })} />
              </div>
              {payment.paymentMethod === PaymentMethod.Cash ? (
                <div className="space-y-1">
                  <Label>Recibido</Label>
                  <Input type="number" min={payment.amount} step="0.000001" value={payment.amountReceived ?? ""}
                    onChange={(event) => setPayments((items) => items.map((item) => item.key === payment.key ? { ...item, amountReceived: Number(event.target.value) || 0 } : item))} />
                </div>
              ) : <div />}
              <div className="space-y-1 md:col-span-1">
                <Label>Aplicado</Label>
                <div className="h-9 pt-2 text-sm font-medium">
                  {payment.quoting ? "Cotizando…" : Number.isFinite(payment.appliedAmount) ? formatCurrency(payment.appliedAmount, saleCurrencyCode) : "Conversión no disponible"}
                </div>
                {payment.paymentMethod === PaymentMethod.Cash && (payment.amountReceived ?? 0) > payment.amount && (
                  <div className="text-xs text-muted-foreground">Cambio: {formatCurrency((payment.amountReceived ?? 0) - payment.amount, payment.currencyCode)}</div>
                )}
              </div>
              <Button type="button" variant="ghost" size="icon" className="self-end" disabled={payments.length === 1}
                onClick={() => setPayments((items) => items.filter((item) => item.key !== payment.key))} aria-label={`Quitar pago ${index + 1}`}>
                <Trash className="size-4" />
              </Button>
              <Input className="md:col-span-6" placeholder="Referencia opcional" value={payment.reference}
                onChange={(event) => setPayments((items) => items.map((item) => item.key === payment.key ? { ...item, reference: event.target.value } : item))} />
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addPayment} disabled={remaining <= 0}>
            <Plus className="mr-2 size-4" />Agregar otro pago
          </Button>
        </div>

        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between"><Label htmlFor="credit-sale">Venta a crédito</Label><Switch id="credit-sale" checked={isCredit} onCheckedChange={setIsCredit} /></div>
          {isCredit && <Input className="mt-3" type="date" value={creditDueDate} onChange={(event) => setCreditDueDate(event.target.value)} />}
        </div>

        {overpayment && <p className="text-sm text-destructive">Los equivalentes aplicados exceden el total de la venta.</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="button" disabled={!valid || isSubmitting} onClick={() => void confirm()}>
            {isSubmitting && <Spinner size="sm" className="mr-2" />}Confirmar venta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
