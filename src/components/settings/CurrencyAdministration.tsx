import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  cancelExchangeRate,
  createExchangeRate,
  disableCurrency,
  enableCurrency,
  getCurrencyCatalog,
  getCurrencyConfiguration,
  getExchangeRates,
} from "@/api/currenciesApi";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { CurrencyConfiguration, CurrencyDefinition, ExchangeRate } from "@/types/Currency";

export function CurrencyAdministration({ accountingCurrencyCode }: { accountingCurrencyCode: string }) {
  const { refreshCurrencies } = useCurrency();
  const [catalog, setCatalog] = useState<CurrencyDefinition[]>([]);
  const [configuration, setConfiguration] = useState<CurrencyConfiguration | null>(null);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [selectedCode, setSelectedCode] = useState("USD");
  const [rate, setRate] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [nextCatalog, nextConfiguration, nextRates] = await Promise.all([
      getCurrencyCatalog(),
      getCurrencyConfiguration(),
      getExchangeRates(),
    ]);
    setCatalog(nextCatalog);
    setConfiguration(nextConfiguration);
    setRates(nextRates);
    const firstForeign = nextConfiguration.enabledCurrencies.find(
      (currency) => currency.isEnabled && currency.currencyCode !== nextConfiguration.accountingCurrencyCode,
    );
    if (firstForeign) setSelectedCode(firstForeign.currencyCode);
  };

  useEffect(() => {
    // Carga inicial del recurso remoto; load administra explícitamente sus estados de UI.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load().catch(() => toast.error("No se pudo cargar la configuración multimoneda."));
  }, []);

  const enabledCodes = useMemo(
    () => new Set(configuration?.enabledCurrencies.filter((item) => item.isEnabled).map((item) => item.currencyCode)),
    [configuration],
  );

  const toggleCurrency = async (code: string, enabled: boolean) => {
    try {
      if (enabled) await enableCurrency(code);
      else await disableCurrency(code);
      await Promise.all([load(), refreshCurrencies()]);
      toast.success(enabled ? `${code} habilitada` : `${code} deshabilitada`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar la moneda.");
    }
  };

  const saveRate = async () => {
    if (!rate || !validFrom || !validTo) return;
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
      toast.success("Cotización registrada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo registrar la cotización.");
    } finally {
      setSaving(false);
    }
  };

  const cancelRate = async (id: string) => {
    try {
      await cancelExchangeRate(id);
      await load();
      toast.success("Cotización cancelada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cancelar la cotización.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monedas y cotizaciones</CardTitle>
        <CardDescription>
          Una tasa indica cuántas unidades de {accountingCurrencyCode} equivalen a una unidad de la moneda origen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {catalog.map((currency) => {
            const enabled = enabledCodes.has(currency.code);
            const locked = currency.code === accountingCurrencyCode;
            return (
              <Button
                key={currency.code}
                type="button"
                size="sm"
                variant={enabled ? "default" : "outline"}
                disabled={locked}
                onClick={() => void toggleCurrency(currency.code, !enabled)}
                title={currency.name}
              >
                {currency.code}{currency.isCrypto ? " · digital" : ""}
              </Button>
            );
          })}
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="rateCurrency">Moneda origen</Label>
            <select
              id="rateCurrency"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={selectedCode}
              onChange={(event) => setSelectedCode(event.target.value)}
            >
              {configuration?.enabledCurrencies
                .filter((item) => item.isEnabled && item.currencyCode !== accountingCurrencyCode)
                .map((item) => <option key={item.currencyCode}>{item.currencyCode}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rateValue">Tasa a {accountingCurrencyCode}</Label>
            <Input id="rateValue" type="number" min="0" step="0.000000000001" value={rate} onChange={(event) => setRate(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="validFrom">Vigente desde</Label>
            <Input id="validFrom" type="datetime-local" value={validFrom} onChange={(event) => setValidFrom(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="validTo">Vigente hasta</Label>
            <Input id="validTo" type="datetime-local" value={validTo} onChange={(event) => setValidTo(event.target.value)} />
          </div>
        </div>
        <Button type="button" onClick={() => void saveRate()} disabled={saving || !selectedCode || !rate || !validFrom || !validTo}>
          Registrar tasa inmutable
        </Button>

        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left">
              <tr><th className="p-2">Moneda</th><th className="p-2">Tasa</th><th className="p-2">Vigencia UTC</th><th className="p-2">Estado</th><th className="p-2" /></tr>
            </thead>
            <tbody>
              {rates.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-2">{item.currencyCode}/{item.accountingCurrencyCode}</td>
                  <td className="p-2 font-mono">{item.rateToAccounting}</td>
                  <td className="p-2">{new Date(item.validFrom).toLocaleString()} – {new Date(item.validTo).toLocaleString()}</td>
                  <td className="p-2">{item.cancelledAt ? "Cancelada" : "Activa"}</td>
                  <td className="p-2 text-right">
                    {!item.cancelledAt && new Date(item.validFrom) > new Date() && (
                      <Button type="button" size="sm" variant="outline" onClick={() => void cancelRate(item.id)}>Cancelar</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
