import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getPaymentSummary,
  type PaymentSummary as PaymentSummaryData,
  type PaymentMethod,
} from "@/api/salesApi";

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  Cash: "Efectivo",
  Card: "Tarjeta",
  Transfer: "Transferencia",
  Voucher: "Vale/Cupón",
  Other: "Otro",
};

const PAYMENT_METHOD_COLORS: Record<PaymentMethod, string> = {
  Cash: "bg-green-500",
  Card: "bg-blue-500",
  Transfer: "bg-purple-500",
  Voucher: "bg-orange-500",
  Other: "bg-gray-500",
};

interface PaymentSummaryProps {
  startDate?: Date;
  endDate?: Date;
}

function ProgressBar({
  percentage,
  colorClass,
}: {
  percentage: number;
  colorClass: string;
}) {
  // Usar solo clases Tailwind sin estilos inline
  const roundedPercentage = Math.max(2, Math.round(percentage));
  const widthClass =
    roundedPercentage >= 100
      ? "w-full"
      : roundedPercentage >= 75
      ? "w-3/4"
      : roundedPercentage >= 50
      ? "w-1/2"
      : roundedPercentage >= 33
      ? "w-1/3"
      : roundedPercentage >= 25
      ? "w-1/4"
      : "w-1/6";

  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
      <div
        className={`h-full transition-all duration-300 ${colorClass} ${widthClass}`}
        title={`${percentage.toFixed(1)}%`}
      />
    </div>
  );
}

export function PaymentSummary({ startDate, endDate }: PaymentSummaryProps) {
  const [summary, setSummary] = useState<PaymentSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSummary() {
      setLoading(true);
      setError(null);
      try {
        const data = await getPaymentSummary(startDate, endDate);
        setSummary(data);
      } catch (err) {
        console.error("Failed to load payment summary:", err);
        setError("No se pudo cargar el resumen de pagos");
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            {error || "No hay datos disponibles"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);

  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Ventas</CardDescription>
            <CardTitle className="text-3xl">
              {summary.totalSalesCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Del {new Date(summary.startDate).toLocaleDateString()} al{" "}
              {new Date(summary.endDate).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monto Total</CardDescription>
            <CardTitle className="text-3xl">
              {formatCurrency(summary.totalAmount)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Promedio:{" "}
              {formatCurrency(
                summary.totalAmount / (summary.totalSalesCount || 1)
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Métodos de Pago</CardDescription>
            <CardTitle className="text-3xl">
              {summary.paymentMethodBreakdown.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {summary.paymentMethodBreakdown.reduce(
                (sum, m) => sum + m.transactionCount,
                0
              )}{" "}
              transacciones
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Desglose por Método de Pago</CardTitle>
          <CardDescription>Distribución de pagos por método</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summary.paymentMethodBreakdown.map((method) => {
              const percentage =
                (method.totalAmount / summary.totalAmount) * 100;

              return (
                <div key={method.method} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          PAYMENT_METHOD_COLORS[method.method]
                        }`}
                      />
                      <span className="font-medium">
                        {PAYMENT_METHOD_LABELS[method.method]}
                      </span>
                      <Badge variant="secondary" className="ml-2">
                        {method.transactionCount}
                      </Badge>
                    </div>
                    <span className="font-semibold">
                      {formatCurrency(method.totalAmount)}
                    </span>
                  </div>
                  <ProgressBar
                    percentage={percentage}
                    colorClass={PAYMENT_METHOD_COLORS[method.method]}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {percentage.toFixed(1)}% del total
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Daily Summaries */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen Diario</CardTitle>
          <CardDescription>Ventas y pagos por día</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summary.dailySummaries.slice(-7).map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="space-y-1">
                  <p className="font-medium">
                    {new Date(day.date).toLocaleDateString("es-MX", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                  <div className="flex gap-1">
                    {day.paymentBreakdown.map((method) => (
                      <Badge
                        key={method.method}
                        variant="outline"
                        className="text-xs"
                      >
                        {PAYMENT_METHOD_LABELS[method.method]}:{" "}
                        {method.transactionCount}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {formatCurrency(day.totalAmount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {day.salesCount} {day.salesCount === 1 ? "venta" : "ventas"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
