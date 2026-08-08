import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowClockwise,
  CalendarBlank,
  CheckCircle,
  CurrencyCircleDollar,
  Info,
  LockKey,
  WarningCircle,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  cancelExchangeRate,
  createExchangeRate,
  disableCurrency,
  enableCurrency,
  getCurrencyCatalog,
  getCurrencyConfiguration,
  getExchangeRates,
} from "@/api/currenciesApi";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { findOverlappingRate, getRateStatus, type RateStatus } from "@/lib/currencyRates";
import { Alert } from "@/components/ui/Alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CurrencyConfiguration, CurrencyDefinition, ExchangeRate } from "@/types/Currency";

type RateFilter = "all" | "current" | "upcoming" | "history";

const dateTimeFormatter = new Intl.DateTimeFormat("es-BO", {
  dateStyle: "medium",
  timeStyle: "short",
});

const rateFormatter = new Intl.NumberFormat("es-BO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 12,
});

function toDateTimeLocal(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function getInitialValidity() {
  const start = new Date();
  start.setSeconds(0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return { validFrom: toDateTimeLocal(start), validTo: toDateTimeLocal(end) };
}

function statusBadge(status: RateStatus) {
  if (status === "current") return <Badge className="bg-emerald-600 hover:bg-emerald-600">Vigente</Badge>;
  if (status === "upcoming") return <Badge variant="secondary">Programada</Badge>;
  if (status === "cancelled") return <Badge variant="destructive">Cancelada</Badge>;
  return <Badge variant="outline">Vencida</Badge>;
}

/** Administra las monedas operativas y sus cotizaciones manuales por tenant. */
export function CurrencyAdministration() {
  const { hasPermission } = useAuth();
  const { refreshCurrencies } = useCurrency();
  const canManage = hasPermission("Settings.Manage");
  const [initialValidity] = useState(() => getInitialValidity());
  const [catalog, setCatalog] = useState<CurrencyDefinition[]>([]);
  const [configuration, setConfiguration] = useState<CurrencyConfiguration | null>(null);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [rate, setRate] = useState("");
  const [validFrom, setValidFrom] = useState(initialValidity.validFrom);
  const [validTo, setValidTo] = useState(initialValidity.validTo);
  const [currencyFilter, setCurrencyFilter] = useState("all");
  const [rateFilter, setRateFilter] = useState<RateFilter>("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingCode, setTogglingCode] = useState<string | null>(null);
  const [rateToCancel, setRateToCancel] = useState<ExchangeRate | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [nextCatalog, nextConfiguration, nextRates] = await Promise.all([
        getCurrencyCatalog(),
        getCurrencyConfiguration(),
        getExchangeRates(),
      ]);
      setCatalog(nextCatalog);
      setConfiguration(nextConfiguration);
      setRates(nextRates);
      const selectable = nextConfiguration.enabledCurrencies.filter(
        (currency) => currency.isEnabled && currency.currencyCode !== nextConfiguration.accountingCurrencyCode,
      );
      setSelectedCode((current) => selectable.some((item) => item.currencyCode === current)
        ? current
        : (selectable[0]?.currencyCode ?? ""));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "No se pudo cargar la configuración multimoneda.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Carga inicial del recurso remoto; load administra explícitamente sus estados de UI.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const enabledCodes = useMemo(
    () => new Set(configuration?.enabledCurrencies.filter((item) => item.isEnabled).map((item) => item.currencyCode)),
    [configuration],
  );

  const enabledForeignCurrencies = useMemo(
    () => configuration?.enabledCurrencies.filter(
      (currency) => currency.isEnabled && currency.currencyCode !== configuration.accountingCurrencyCode,
    ) ?? [],
    [configuration],
  );

  const currentRates = useMemo(
    () => rates.filter((item) => getRateStatus(item) === "current"),
    [rates],
  );

  const currenciesWithoutCurrentRate = useMemo(
    () => enabledForeignCurrencies.filter(
      (currency) => !currentRates.some((item) => item.currencyCode === currency.currencyCode),
    ),
    [currentRates, enabledForeignCurrencies],
  );

  const filteredRates = useMemo(() => rates.filter((item) => {
    if (currencyFilter !== "all" && item.currencyCode !== currencyFilter) return false;
    const status = getRateStatus(item);
    if (rateFilter === "current") return status === "current";
    if (rateFilter === "upcoming") return status === "upcoming";
    if (rateFilter === "history") return status === "expired" || status === "cancelled";
    return true;
  }), [currencyFilter, rateFilter, rates]);

  const formError = useMemo(() => {
    const numericRate = Number(rate);
    const start = new Date(validFrom).getTime();
    const end = new Date(validTo).getTime();
    if (!selectedCode) return "Habilite una moneda distinta de la contable para registrar cotizaciones.";
    if (rate && (!Number.isFinite(numericRate) || numericRate <= 0)) return "La tasa debe ser mayor a 0.";
    if (validFrom && validTo && (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)) {
      return "La fecha final debe ser posterior a la fecha inicial.";
    }
    if (rate && validFrom && validTo) {
      const overlap = findOverlappingRate(rates, selectedCode, start, end);
      if (overlap) {
        return `La vigencia se cruza con una cotización del ${dateTimeFormatter.format(new Date(overlap.validFrom))} al ${dateTimeFormatter.format(new Date(overlap.validTo))}.`;
      }
    }
    return null;
  }, [rate, rates, selectedCode, validFrom, validTo]);

  const toggleCurrency = async (code: string, enabled: boolean) => {
    if (!canManage || togglingCode) return;
    setTogglingCode(code);
    try {
      if (enabled) await enableCurrency(code);
      else await disableCurrency(code);
      await Promise.all([load(), refreshCurrencies()]);
      toast.success(enabled ? `${code} habilitada` : `${code} deshabilitada`, {
        description: enabled
          ? "Ya puede usarse en nuevas operaciones cuando tenga una cotización vigente."
          : "Su historial se conserva y ya no aparece en nuevas operaciones.",
      });
    } catch (error) {
      toast.error("No se pudo actualizar la moneda", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setTogglingCode(null);
    }
  };

  const saveRate = async () => {
    if (formError || !rate || !validFrom || !validTo || !canManage) return;
    setSaving(true);
    try {
      await createExchangeRate({
        currencyCode: selectedCode,
        rateToAccounting: Number(rate),
        validFrom: new Date(validFrom).toISOString(),
        validTo: new Date(validTo).toISOString(),
      });
      setRate("");
      await load();
      toast.success("Cotización registrada", {
        description: "La nueva ventana de vigencia quedó disponible para las operaciones.",
      });
    } catch (error) {
      toast.error("No se pudo registrar la cotización", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmCancelRate = async () => {
    if (!rateToCancel || !canManage) return;
    setCancelling(true);
    try {
      await cancelExchangeRate(rateToCancel.id);
      setRateToCancel(null);
      await load();
      toast.success("Cotización cancelada", {
        description: "La ventana futura ya no se utilizará en nuevas operaciones.",
      });
    } catch (error) {
      toast.error("No se pudo cancelar la cotización", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setCancelling(false);
    }
  };

  if (loadError && !configuration) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monedas y Cotizaciones</CardTitle>
          <CardDescription>Administre las monedas disponibles para su organización.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="error" title="No se pudo cargar" message={loadError} />
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
            <ArrowClockwise aria-hidden="true" />
            {loading ? "Reintentando…" : "Reintentar"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="gap-4 border-b">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>Monedas y Cotizaciones</CardTitle>
            <CardDescription>
              Habilite monedas y defina cuántas unidades de {configuration?.accountingCurrencyCode ?? "la moneda contable"} equivalen a 1 unidad de la moneda origen.
            </CardDescription>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => void load()} disabled={loading}>
            <ArrowClockwise className={loading ? "animate-spin" : ""} aria-hidden="true" />
            Actualizar
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">Moneda Contable</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{configuration?.accountingCurrencyCode ?? "—"}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">Monedas Habilitadas</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{enabledCodes.size}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">Cotizaciones Vigentes</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{currentRates.length}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8 pt-6">
        {!canManage && (
          <Alert
            variant="info"
            title="Modo de Solo Lectura"
            message="Puede consultar la configuración, pero necesita el permiso Settings.Manage para modificarla."
          />
        )}

        {currenciesWithoutCurrentRate.length > 0 && (
          <Alert
            variant="info"
            title="Faltan Cotizaciones Vigentes"
            message="Estas monedas están habilitadas, pero no pueden utilizarse ahora en conversiones."
            items={currenciesWithoutCurrentRate.map((currency) => `${currency.currencyCode} · ${currency.name}`)}
          />
        )}

        <section aria-labelledby="enabled-currencies-title" className="space-y-4">
          <div>
            <h3 id="enabled-currencies-title" className="font-semibold text-pretty">Monedas Disponibles</h3>
            <p className="text-sm text-muted-foreground">Deshabilitar una moneda no elimina sus operaciones ni sus cotizaciones históricas.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {catalog.map((currency) => {
              const enabled = enabledCodes.has(currency.code);
              const isAccounting = currency.code === configuration?.accountingCurrencyCode;
              const isDefault = currency.code === configuration?.defaultCurrencyCode;
              const locked = isAccounting || isDefault;
              const isBusy = togglingCode === currency.code;
              return (
                <div key={currency.code} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={enabled ? "rounded-full bg-primary/10 p-2 text-primary" : "rounded-full bg-muted p-2 text-muted-foreground"}>
                      <CurrencyCircleDollar aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold" translate="no">{currency.code}</span>
                        {currency.isCrypto && <Badge variant="outline">Digital</Badge>}
                        {isAccounting && <Badge variant="secondary">Contable</Badge>}
                        {isDefault && !isAccounting && <Badge variant="secondary">Predeterminada</Badge>}
                      </div>
                      <p className="truncate text-sm text-muted-foreground" title={currency.name}>{currency.name}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {locked && <LockKey className="text-muted-foreground" aria-label="Moneda protegida" />}
                    <Switch
                      checked={enabled}
                      disabled={!canManage || locked || Boolean(togglingCode)}
                      onCheckedChange={(checked) => void toggleCurrency(currency.code, checked)}
                      aria-label={`${enabled ? "Deshabilitar" : "Habilitar"} ${currency.name}`}
                      aria-busy={isBusy}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 shrink-0" aria-hidden="true" />
            La moneda contable y la moneda operativa predeterminada están protegidas. Cambie primero la predeterminada si necesita deshabilitarla.
          </p>
        </section>

        <section aria-labelledby="new-rate-title" className="space-y-4 rounded-xl border bg-muted/20 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <CalendarBlank aria-hidden="true" />
            </div>
            <div>
              <h3 id="new-rate-title" className="font-semibold text-pretty">Registrar Nueva Cotización</h3>
              <p className="text-sm text-muted-foreground">Las cotizaciones son inmutables. Para corregir una futura, cancélela y registre otra ventana.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="rateCurrency">Moneda Origen</Label>
              <Select value={selectedCode} onValueChange={setSelectedCode} disabled={!canManage || enabledForeignCurrencies.length === 0}>
                <SelectTrigger id="rateCurrency" className="w-full" aria-label="Moneda origen">
                  <SelectValue placeholder="Seleccione una moneda" />
                </SelectTrigger>
                <SelectContent>
                  {enabledForeignCurrencies.map((item) => (
                    <SelectItem key={item.currencyCode} value={item.currencyCode}>
                      <span translate="no">{item.currencyCode}</span> · {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rateValue">Tasa a {configuration?.accountingCurrencyCode}</Label>
              <Input
                id="rateValue"
                name="rateToAccounting"
                type="number"
                inputMode="decimal"
                autoComplete="off"
                min="0.000000000001"
                step="0.000000000001"
                value={rate}
                onChange={(event) => setRate(event.target.value)}
                placeholder="Ej.: 6,96"
                disabled={!canManage || !selectedCode}
                aria-invalid={Boolean(rate && formError)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validFrom">Vigente Desde</Label>
              <Input
                id="validFrom"
                name="validFrom"
                type="datetime-local"
                autoComplete="off"
                value={validFrom}
                onChange={(event) => setValidFrom(event.target.value)}
                disabled={!canManage || !selectedCode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validTo">Vigente Hasta</Label>
              <Input
                id="validTo"
                name="validTo"
                type="datetime-local"
                autoComplete="off"
                value={validTo}
                onChange={(event) => setValidTo(event.target.value)}
                disabled={!canManage || !selectedCode}
              />
            </div>
          </div>

          {selectedCode && rate && Number(rate) > 0 && (
            <div className="flex flex-col gap-1 rounded-lg border bg-background p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="text-muted-foreground">Vista previa</span>
              <span className="font-medium tabular-nums">
                1 <span translate="no">{selectedCode}</span> = {rateFormatter.format(Number(rate))} <span translate="no">{configuration?.accountingCurrencyCode}</span>
              </span>
            </div>
          )}

          {formError && (rate || !selectedCode) && (
            <p className="flex items-start gap-2 text-sm text-destructive" role="alert">
              <WarningCircle className="mt-0.5 shrink-0" aria-hidden="true" />
              {formError}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">Las fechas se ingresan en su hora local y se guardan como UTC.</p>
            <Button
              type="button"
              onClick={() => void saveRate()}
              disabled={!canManage || saving || !selectedCode || !rate || !validFrom || !validTo || Boolean(formError)}
            >
              <CheckCircle aria-hidden="true" />
              {saving ? "Registrando…" : "Registrar Cotización"}
            </Button>
          </div>
        </section>

        <section aria-labelledby="rate-history-title" className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 id="rate-history-title" className="font-semibold text-pretty">Historial de Cotizaciones</h3>
              <p className="text-sm text-muted-foreground">Consulte vigencias en su hora local. El inicio es inclusivo y el fin exclusivo.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                <SelectTrigger className="w-full sm:w-52" aria-label="Filtrar por moneda">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las monedas</SelectItem>
                  {enabledForeignCurrencies.map((item) => (
                    <SelectItem key={item.currencyCode} value={item.currencyCode}>{item.currencyCode} · {item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Tabs value={rateFilter} onValueChange={(value) => setRateFilter(value as RateFilter)}>
                <TabsList className="grid w-full grid-cols-4 sm:w-auto">
                  <TabsTrigger value="all">Todas</TabsTrigger>
                  <TabsTrigger value="current">Vigentes</TabsTrigger>
                  <TabsTrigger value="upcoming">Futuras</TabsTrigger>
                  <TabsTrigger value="history">Historial</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[780px] text-sm">
              <thead className="bg-muted/60 text-left">
                <tr>
                  <th scope="col" className="p-3 font-medium">Par</th>
                  <th scope="col" className="p-3 font-medium">Tasa</th>
                  <th scope="col" className="p-3 font-medium">Vigente Desde</th>
                  <th scope="col" className="p-3 font-medium">Vigente Hasta</th>
                  <th scope="col" className="p-3 font-medium">Estado</th>
                  <th scope="col" className="p-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRates.map((item) => {
                  const status = getRateStatus(item);
                  return (
                    <tr key={item.id} className="border-t hover:bg-muted/30">
                      <td className="p-3 font-medium" translate="no">{item.currencyCode}/{item.accountingCurrencyCode}</td>
                      <td className="p-3 font-mono tabular-nums">{rateFormatter.format(item.rateToAccounting)}</td>
                      <td className="p-3 whitespace-nowrap">{dateTimeFormatter.format(new Date(item.validFrom))}</td>
                      <td className="p-3 whitespace-nowrap">{dateTimeFormatter.format(new Date(item.validTo))}</td>
                      <td className="p-3">{statusBadge(status)}</td>
                      <td className="p-3 text-right">
                        {status === "upcoming" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setRateToCancel(item)}
                            disabled={!canManage}
                          >
                            Cancelar
                          </Button>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  );
                })}
                {filteredRates.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No hay cotizaciones que coincidan con los filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </CardContent>

      <AlertDialog open={Boolean(rateToCancel)} onOpenChange={(open) => !open && !cancelling && setRateToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar Esta Cotización?</AlertDialogTitle>
            <AlertDialogDescription>
              {rateToCancel
                ? `Se cancelará la tasa ${rateFormatter.format(rateToCancel.rateToAccounting)} ${rateToCancel.accountingCurrencyCode} por 1 ${rateToCancel.currencyCode}, programada desde ${dateTimeFormatter.format(new Date(rateToCancel.validFrom))}.`
                : "La cotización futura dejará de estar disponible."}
              {" "}Esta acción conserva el registro de auditoría y no puede deshacerse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Conservar Cotización</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                void confirmCancelRate();
              }}
              disabled={cancelling}
            >
              {cancelling ? "Cancelando…" : "Cancelar Cotización"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
