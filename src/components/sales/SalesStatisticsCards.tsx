import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SalesStatistics } from "@/api/salesApi";
import {
  IconCash,
  IconReceipt,
  IconChartLine,
  IconCreditCard,
} from "@tabler/icons-react";

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-32"></div>
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

  // Colores para el gráfico
  const getBarColor = (index: number) => {
    const colors = [
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
      "#f59e0b",
      "#10b981",
      "#06b6d4",
      "#6366f1",
      "#f97316",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-4">
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Total Vendido
            </CardTitle>
            <IconCash className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {formatCurrency(statistics.totalSales)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Transacciones
            </CardTitle>
            <IconReceipt className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {statistics.transactionCount}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              Ticket Promedio
            </CardTitle>
            <IconChartLine className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {formatCurrency(statistics.averageTicket)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50 border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
              Métodos de Pago
            </CardTitle>
            <IconCreditCard className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {statistics.salesByPaymentMethod.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desglose por método de pago */}
      {statistics.salesByPaymentMethod.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Desglose por Método de Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statistics.salesByPaymentMethod.map((item, index) => (
                <div
                  key={item.method}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={
                        {
                          backgroundColor: getBarColor(index),
                        } as React.CSSProperties
                      }
                      aria-hidden="true"
                    />
                    <div>
                      <div className="font-medium text-foreground">
                        {getPaymentMethodName(item.method)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.count}{" "}
                        {item.count === 1 ? "transacción" : "transacciones"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-foreground">
                      {formatCurrency(item.amount)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {((item.amount / statistics.totalSales) * 100).toFixed(1)}
                      %
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
