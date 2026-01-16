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

export function SalesStatisticsCards({
  statistics,
  loading,
}: SalesStatisticsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card
            key={i}
            className="animate-pulse rounded-lg border-border/60 bg-card shadow-none"
          >
            <CardHeader className="gap-2 pb-2">
              <div className="h-3 w-20 rounded bg-muted"></div>
            </CardHeader>
            <CardContent>
              <div className="h-7 w-28 rounded bg-muted"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!statistics) {
    return null;
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-lg border-border/60 bg-card shadow-none">
          <CardHeader className="gap-2 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Total vendido
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-muted/40">
                <CurrencyDollar className="h-4 w-4 text-muted-foreground" weight="duotone" />
              </div>
            </div>
            <CardDescription>Ingresos netos del periodo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground tabular-nums font-mono">
              {formatCurrency(statistics.totalSales)}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-border/60 bg-card shadow-none">
          <CardHeader className="gap-2 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Transacciones
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-muted/40">
                <Receipt className="h-4 w-4 text-muted-foreground" weight="duotone" />
              </div>
            </div>
            <CardDescription>Operaciones registradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground tabular-nums font-mono">
              {statistics.transactionCount}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-border/60 bg-card shadow-none">
          <CardHeader className="gap-2 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Ticket promedio
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-muted/40">
                <TrendUp className="h-4 w-4 text-muted-foreground" weight="duotone" />
              </div>
            </div>
            <CardDescription>Promedio por venta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground tabular-nums font-mono">
              {formatCurrency(statistics.averageTicket)}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-border/60 bg-card shadow-none">
          <CardHeader className="gap-2 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Métodos de pago
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-muted/40">
                <CreditCard className="h-4 w-4 text-muted-foreground" weight="duotone" />
              </div>
            </div>
            <CardDescription>Cobros activos en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground tabular-nums font-mono">
              {statistics.salesByPaymentMethod.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desglose por método de pago */}
      {statistics.salesByPaymentMethod.length > 0 && (
        <Card className="rounded-lg border-border/60 bg-card shadow-none">
          <CardHeader className="gap-2">
            <CardTitle className="text-base font-semibold tracking-tight">
              Desglose por método de pago
            </CardTitle>
            <CardDescription>
              Distribución del ingreso por canal de cobro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statistics.salesByPaymentMethod.map((item) => {
                const percentage = statistics.totalSales
                  ? (item.amount / statistics.totalSales) * 100
                  : 0;

                return (
                  <div
                    key={item.method}
                    className="rounded-lg border border-border/60 bg-muted/40 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {getPaymentMethodName(item.method)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.count}{" "}
                          {item.count === 1 ? "transacción" : "transacciones"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-foreground tabular-nums font-mono">
                          {formatCurrency(item.amount)}
                        </div>
                        <div className="text-xs text-muted-foreground tabular-nums font-mono">
                          {percentage.toFixed(1)}%
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
