import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bank, MagnifyingGlass, Money, WarningCircle } from "@phosphor-icons/react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, EmptyState } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { PAGE_LAYOUT_CLASS } from "@/lib/constants";
import { PaymentMethod, type PaymentMethodType } from "@/api/salesApi";
import { useCurrency } from "@/contexts/CurrencyContext";
import { getCurrencyQuote } from "@/api/currenciesApi";
import {
  getAccountReceivable,
  getAccountsReceivable,
  getAccountsReceivableSummary,
  registerReceivablePayment,
  voidReceivablePayment,
  type AccountReceivableDetail,
  type AccountReceivableListItem,
  type AccountsReceivableSummary,
  type ReceivableState,
} from "@/api/accountsReceivableApi";

const stateLabels: Record<ReceivableState, string> = {
  Open: "Pendiente",
  Partial: "Parcial",
  Overdue: "Vencida",
  Paid: "Pagada",
  Cancelled: "Anulada",
};

const stateVariant: Record<ReceivableState, "default" | "secondary" | "destructive" | "outline"> = {
  Open: "secondary",
  Partial: "default",
  Overdue: "destructive",
  Paid: "outline",
  Cancelled: "secondary",
};

const formatDate = (value: string) => new Intl.DateTimeFormat("es-BO", {
  dateStyle: "medium",
}).format(new Date(value));

export function AccountsReceivablePage() {
  useDocumentTitle("Cuentas por cobrar");
  const { hasPermission } = useAuth();
  const { configuration, formatCurrency } = useCurrency();
  const canManage = hasPermission("AccountsReceivable.Manage");
  const [items, setItems] = useState<AccountReceivableListItem[]>([]);
  const [summary, setSummary] = useState<AccountsReceivableSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [state, setState] = useState("all");
  const [selected, setSelected] = useState<AccountReceivableDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>(PaymentMethod.Cash);
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentCurrency, setPaymentCurrency] = useState("USD");
  const [paymentEquivalent, setPaymentEquivalent] = useState<number | null>(null);
  const [paymentRateId, setPaymentRateId] = useState<string | null>(null);
  const [voidPaymentId, setVoidPaymentId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [page, nextSummary] = await Promise.all([
        getAccountsReceivable({ search: search.trim() || undefined, status: state === "all" ? undefined : state, pageSize: 100 }),
        getAccountsReceivableSummary(),
      ]);
      setItems(page.items);
      setSummary(nextSummary);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar la cartera");
    } finally {
      setLoading(false);
    }
  }, [search, state]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const openDetail = async (id: string) => {
    try {
      const detail = await getAccountReceivable(id);
      setSelected(detail);
      setPaymentCurrency(detail.currencyCode);
      setDetailOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el estado de cuenta");
    }
  };

  useEffect(() => {
    const amount = Number(paymentAmount);
    if (!selected || !Number.isFinite(amount) || amount <= 0) {
      // Reinicia el resultado derivado cuando la entrada deja de ser cotizable.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPaymentEquivalent(null);
      setPaymentRateId(null);
      return;
    }
    let active = true;
    void getCurrencyQuote(paymentCurrency, selected.currencyCode, amount)
      .then((quote) => {
        if (!active) return;
        setPaymentEquivalent(quote.convertedAmount ?? null);
        setPaymentRateId(quote.fromExchangeRateId ?? null);
      })
      .catch(() => {
        if (active) { setPaymentEquivalent(null); setPaymentRateId(null); }
      });
    return () => { active = false; };
  }, [paymentAmount, paymentCurrency, selected]);

  const refreshDetail = async (id: string) => {
    const detail = await getAccountReceivable(id);
    setSelected(detail);
    await load();
  };

  const submitPayment = async () => {
    if (!selected) return;
    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Ingresa un abono válido");
      return;
    }
    setSaving(true);
    try {
      if (paymentEquivalent === null) throw new Error("Conversión no disponible");
      await registerReceivablePayment(selected.id, { amount, method: paymentMethod, amountReceived: paymentMethod === PaymentMethod.Cash ? amount : undefined, reference: paymentReference || undefined, currencyCode: paymentCurrency, exchangeRateId: paymentRateId });
      toast.success("Abono registrado");
      setPaymentOpen(false);
      setPaymentAmount("");
      setPaymentReference("");
      await refreshDetail(selected.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo registrar el abono");
    } finally {
      setSaving(false);
    }
  };

  const submitVoidPayment = async () => {
    if (!selected) return;
    if (voidReason.trim().length < 3 || !voidPaymentId) {
      toast.error("Indica un motivo de al menos tres caracteres");
      return;
    }
    setSaving(true);
    try {
      await voidReceivablePayment(selected.id, voidPaymentId, voidReason.trim());
      toast.success("Abono anulado");
      setVoidPaymentId(null);
      setVoidReason("");
      await refreshDetail(selected.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo anular el abono");
    } finally {
      setSaving(false);
    }
  };

  const paymentMethods = useMemo(() => [
    [PaymentMethod.Cash, "Efectivo"], [PaymentMethod.Card, "Tarjeta"], [PaymentMethod.Voucher, "Voucher"], [PaymentMethod.Transfer, "Transferencia"], [PaymentMethod.Other, "Otro"],
  ] as const, []);

  return (
    <DashboardLayout breadcrumbs={[{ label: "Inicio", href: "/dashboard" }, { label: "Cuentas por cobrar" }]}> 
      <main className={PAGE_LAYOUT_CLASS}>
        <PageHeader title="Cuentas por cobrar" description="Controla créditos, vencimientos y abonos de tus clientes." />
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard title="Saldo por cobrar" value={summary?.totalOutstanding ?? 0} icon={<Money className="size-5" />} />
          <SummaryCard title="Saldo vencido" value={summary?.totalOverdue ?? 0} icon={<WarningCircle className="size-5" />} destructive />
          <SummaryCard title="Por vencer (7 días)" value={summary?.totalDueSoon ?? 0} icon={<Bank className="size-5" />} />
        </div>
        <Card className="mt-6">
          <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Cartera de clientes</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative"><MagnifyingGlass className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cliente o venta" /></div>
              <Select value={state} onValueChange={setState}><SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos los estados</SelectItem><SelectItem value="open">Pendiente</SelectItem><SelectItem value="partial">Parcial</SelectItem><SelectItem value="overdue">Vencida</SelectItem><SelectItem value="paid">Pagada</SelectItem></SelectContent></Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? <div className="flex justify-center py-12"><Spinner /></div> : items.length === 0 ? <EmptyState icon={Bank} title="No hay cuentas por cobrar" description="Las ventas realizadas a crédito aparecerán aquí." /> : (
              <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-b text-left text-muted-foreground"><tr><th className="p-3">Cliente</th><th className="p-3">Venta</th><th className="p-3">Vence</th><th className="p-3 text-right">Saldo</th><th className="p-3">Estado</th><th className="p-3" /></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="p-3 font-medium">{item.customerName}</td><td className="p-3">#{item.saleNumber}</td><td className="p-3">{formatDate(item.dueDate)}</td><td className="p-3 text-right font-semibold">{formatCurrency(item.outstandingAmount, item.currencyCode)}<div className="text-xs font-normal text-muted-foreground">{formatCurrency(item.accountingOutstandingAmount, item.accountingCurrencyCode)}</div></td><td className="p-3"><Badge variant={stateVariant[item.state]}>{stateLabels[item.state]}</Badge></td><td className="p-3 text-right"><Button variant="outline" size="sm" onClick={() => void openDetail(item.id)}>Ver cuenta</Button></td></tr>)}</tbody></table></div>
            )}
          </CardContent>
        </Card>
      </main>
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}><DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">{selected && <><DialogHeader><DialogTitle>{selected.customerName}</DialogTitle><DialogDescription>Venta <Link className="underline" to={`/sales/${selected.saleId}/edit`}>#{selected.saleNumber}</Link> · vence {formatDate(selected.dueDate)}</DialogDescription></DialogHeader><div className="grid grid-cols-3 gap-3 rounded-lg bg-muted p-4 text-center"><div><p className="text-xs text-muted-foreground">Original</p><p className="font-semibold">{formatCurrency(selected.originalAmount, selected.currencyCode)}</p></div><div><p className="text-xs text-muted-foreground">Abonado</p><p className="font-semibold">{formatCurrency(selected.paidAmount, selected.currencyCode)}</p></div><div><p className="text-xs text-muted-foreground">Saldo</p><p className="font-semibold">{formatCurrency(selected.outstandingAmount, selected.currencyCode)}</p></div></div><div className="space-y-2"><h3 className="font-semibold">Historial de cobros</h3>{selected.payments.length === 0 ? <p className="text-sm text-muted-foreground">Sin abonos registrados.</p> : selected.payments.map((payment) => <div key={payment.id} className="flex items-center justify-between rounded-md border p-3 text-sm"><div><p className={payment.isVoided ? "line-through text-muted-foreground" : "font-medium"}>{formatCurrency(payment.amount, payment.currencyCode)} · aplicado {formatCurrency(payment.appliedAmount, selected.currencyCode)} · diferencia {formatCurrency(payment.exchangeDifference, selected.accountingCurrencyCode)} · {payment.reference || "Sin referencia"}</p><p className="text-xs text-muted-foreground">{formatDate(payment.createdAt)}{payment.isVoided ? ` · Anulado: ${payment.voidReason}` : ""}</p></div>{canManage && !payment.isVoided && <Button variant="ghost" size="sm" onClick={() => setVoidPaymentId(payment.id)}>Anular</Button>}</div>)}</div><DialogFooter>{canManage && selected.outstandingAmount > 0 && <Button onClick={() => setPaymentOpen(true)}>Registrar abono</Button>}</DialogFooter></>}</DialogContent></Dialog>
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}><DialogContent><DialogHeader><DialogTitle>Registrar abono</DialogTitle><DialogDescription>El equivalente aplicado no puede exceder el saldo pendiente.</DialogDescription></DialogHeader><div className="space-y-3"><div><Label>Moneda entregada</Label><Select value={paymentCurrency} onValueChange={setPaymentCurrency}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{configuration?.enabledCurrencies.filter((currency) => currency.isEnabled).map((currency) => <SelectItem key={currency.currencyCode} value={currency.currencyCode}>{currency.currencyCode}</SelectItem>)}</SelectContent></Select></div><div><Label htmlFor="receivable-amount">Monto entregado</Label><Input id="receivable-amount" type="number" min="0.000001" step="0.000001" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} />{selected && <p className="mt-1 text-xs text-muted-foreground">Equivalente aplicado: {paymentEquivalent === null ? "Conversión no disponible" : formatCurrency(paymentEquivalent, selected.currencyCode)}</p>}</div><div><Label>Método</Label><Select value={paymentMethod.toString()} onValueChange={(value) => setPaymentMethod(Number(value) as PaymentMethodType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{paymentMethods.map(([value, label]) => <SelectItem key={value} value={value.toString()}>{label}</SelectItem>)}</SelectContent></Select></div><div><Label htmlFor="receivable-reference">Referencia</Label><Input id="receivable-reference" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} /></div></div><DialogFooter><Button variant="outline" onClick={() => setPaymentOpen(false)} disabled={saving}>Cancelar</Button><Button onClick={() => void submitPayment()} disabled={saving || paymentEquivalent === null}>{saving ? <Spinner size="sm" /> : "Guardar abono"}</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={voidPaymentId !== null} onOpenChange={(open) => { if (!open && !saving) { setVoidPaymentId(null); setVoidReason(""); } }}><DialogContent><DialogHeader><DialogTitle>Anular abono</DialogTitle><DialogDescription>Esta acción conservará el historial y devolverá el monto al saldo pendiente.</DialogDescription></DialogHeader><div><Label htmlFor="void-reason">Motivo</Label><Input id="void-reason" value={voidReason} onChange={(event) => setVoidReason(event.target.value)} placeholder="Ej. cobro registrado por error" /></div><DialogFooter><Button variant="outline" onClick={() => setVoidPaymentId(null)} disabled={saving}>Cancelar</Button><Button variant="destructive" onClick={() => void submitVoidPayment()} disabled={saving}>Anular abono</Button></DialogFooter></DialogContent></Dialog>
    </DashboardLayout>
  );
}

function SummaryCard({ title, value, icon, destructive = false }: { title: string; value: number; icon: React.ReactNode; destructive?: boolean }) {
  const { configuration, formatCurrency } = useCurrency();
  return <Card><CardContent className="flex items-center gap-4 p-5"><div className={destructive ? "rounded-full bg-destructive/10 p-3 text-destructive" : "rounded-full bg-primary/10 p-3 text-primary"}>{icon}</div><div><p className="text-sm text-muted-foreground">{title}</p><p className="text-xl font-semibold">{formatCurrency(value, configuration?.accountingCurrencyCode)}</p></div></CardContent></Card>;
}
