import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SalesStatistics } from "@/api/salesApi";
import {
  CreditCard,
  CurrencyDollar,
  Receipt,
  TrendUp,
} from "@phosphor-icons/react";

interface SalesStatisticsCardsProps {
  statistics: SalesStatistics | null;
  loading?: boolean;
}

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});
const countFormatter = new Intl.NumberFormat("es-MX");
const percentageFormatter = new Intl.NumberFormat("es-MX", {
  style: "percent",
  maximumFractionDigits: 1,
});

/** Displays compact sales indicators and the payment-method distribution. */
export function SalesStatisticsCards({
  statistics,
  loading,
}: SalesStatisticsCardsProps) {
  if (loading) {
    return (
      <div
        className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span className="sr-only">Cargando indicadores de ventas…</span>
        {[1, 2, 3, 4].map((i) => (
          <Card
            key={i}
            className="motion-safe:animate-pulse rounded-xl border-border/60 bg-card shadow-none"
          >
            <CardHeader className="gap-2 p-3 pb-2 sm:p-4 sm:pb-2">
              <div className="h-3 w-20 max-w-full rounded bg-muted" />
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
              <div className="h-7 w-28 max-w-full rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!statistics) {
    return (
      <Card
        className="rounded-xl border-dashed border-border/60 bg-card shadow-none"
        role="status"
        aria-live="polite"
      >
        <CardContent className="py-8 text-center">
          <Receipt
            className="mx-auto h-7 w-7 text-muted-foreground"
            weight="duotone"
            aria-hidden="true"
          />
          <p className="mt-2 text-sm font-medium text-foreground">
            Sin indicadores disponibles
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Reintenta la carga para consultar el resumen del periodo.
          </p>
        </CardContent>
      </Card>
    );
  }

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

  return (
    <div className="space-y-4">
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Card
          className="min-w-0 rounded-xl border-border/60 bg-card shadow-none"
          aria-label={`Total vendido: ${currencyFormatter.format(statistics.totalSales)}`}
        >
          <CardHeader className="min-w-0 gap-1.5 p-3 pb-1 sm:p-4 sm:pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="truncate text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:text-xs">
                Total vendido
              </CardTitle>
              <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/40 sm:flex">
                <CurrencyDollar className="h-4 w-4 text-muted-foreground" weight="duotone" aria-hidden="true" />
              </div>
            </div>
            <CardDescription className="hidden truncate sm:block">Ingresos netos del periodo</CardDescription>
          </CardHeader>
          <CardContent className="min-w-0 px-3 pb-3 pt-1 sm:px-4 sm:pb-4">
            <div className="truncate font-mono text-lg font-semibold tabular-nums text-foreground sm:text-2xl" title={currencyFormatter.format(statistics.totalSales)}>
              {currencyFormatter.format(statistics.totalSales)}
            </div>
          </CardContent>
        </Card>

        <Card
          className="min-w-0 rounded-xl border-border/60 bg-card shadow-none"
          aria-label={`Transacciones: ${countFormatter.format(statistics.transactionCount)}`}
        >
          <CardHeader className="min-w-0 gap-1.5 p-3 pb-1 sm:p-4 sm:pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="truncate text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:text-xs">
                Transacciones
              </CardTitle>
              <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/40 sm:flex">
                <Receipt className="h-4 w-4 text-muted-foreground" weight="duotone" aria-hidden="true" />
              </div>
            </div>
            <CardDescription className="hidden truncate sm:block">Operaciones registradas</CardDescription>
          </CardHeader>
          <CardContent className="min-w-0 px-3 pb-3 pt-1 sm:px-4 sm:pb-4">
            <div className="truncate font-mono text-lg font-semibold tabular-nums text-foreground sm:text-2xl">
              {countFormatter.format(statistics.transactionCount)}
            </div>
          </CardContent>
        </Card>

        <Card
          className="min-w-0 rounded-xl border-border/60 bg-card shadow-none"
          aria-label={`Ticket promedio: ${currencyFormatter.format(statistics.averageTicket)}`}
        >
          <CardHeader className="min-w-0 gap-1.5 p-3 pb-1 sm:p-4 sm:pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="truncate text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:text-xs">
                Ticket promedio
              </CardTitle>
              <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/40 sm:flex">
                <TrendUp className="h-4 w-4 text-muted-foreground" weight="duotone" aria-hidden="true" />
              </div>
            </div>
            <CardDescription className="hidden truncate sm:block">Promedio por venta</CardDescription>
          </CardHeader>
          <CardContent className="min-w-0 px-3 pb-3 pt-1 sm:px-4 sm:pb-4">
            <div className="truncate font-mono text-lg font-semibold tabular-nums text-foreground sm:text-2xl" title={currencyFormatter.format(statistics.averageTicket)}>
              {currencyFormatter.format(statistics.averageTicket)}
            </div>
          </CardContent>
        </Card>

        <Card
          className="min-w-0 rounded-xl border-border/60 bg-card shadow-none"
          aria-label={`Métodos de pago: ${countFormatter.format(statistics.salesByPaymentMethod.length)}`}
        >
          <CardHeader className="min-w-0 gap-1.5 p-3 pb-1 sm:p-4 sm:pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="truncate text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:text-xs">
                Métodos de pago
              </CardTitle>
              <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/40 sm:flex">
                <CreditCard className="h-4 w-4 text-muted-foreground" weight="duotone" aria-hidden="true" />
              </div>
            </div>
            <CardDescription className="hidden truncate sm:block">Usados en el periodo</CardDescription>
          </CardHeader>
          <CardContent className="min-w-0 px-3 pb-3 pt-1 sm:px-4 sm:pb-4">
            <div className="truncate font-mono text-lg font-semibold tabular-nums text-foreground sm:text-2xl">
              {countFormatter.format(statistics.salesByPaymentMethod.length)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desglose por método de pago */}
      {statistics.salesByPaymentMethod.length > 0 && (
        <Card className="rounded-xl border-border/60 bg-card shadow-none">
          <CardHeader className="gap-2">
            <CardTitle className="text-base font-semibold tracking-tight">
              Desglose por método de pago
            </CardTitle>
            <CardDescription>
              Distribución del ingreso por canal de cobro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {statistics.salesByPaymentMethod.map((item) => {
                const percentage = statistics.totalSales
                  ? (item.amount / statistics.totalSales) * 100
                  : 0;

                return (
                  <div
                    key={item.method}
                    className="min-w-0 rounded-lg border border-border/60 bg-muted/40 p-3"
                  >
                    <div className="flex min-w-0 items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground" title={getPaymentMethodName(item.method)}>
                          {getPaymentMethodName(item.method)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {countFormatter.format(item.count)}{" "}
                          {item.count === 1 ? "transacción" : "transacciones"}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="font-mono text-sm font-semibold tabular-nums text-foreground">
                          {currencyFormatter.format(item.amount)}
                        </div>
                        <div className="font-mono text-xs tabular-nums text-muted-foreground">
                          {percentageFormatter.format(percentage / 100)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
