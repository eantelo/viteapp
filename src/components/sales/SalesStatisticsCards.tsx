import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SalesStatistics } from "@/api/salesApi";
import {
  IconCash,
  IconReceipt,
  IconChartLine,
  IconCreditCard,
} from "@tabler/icons-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

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
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-32"></div>
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

  // Preparar datos para el gráfico por hora
  const hourlyChartData = statistics.salesByHour.map((item) => ({
    hour: `${item.hour}:00`,
    amount: item.amount,
    count: item.count,
  }));

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
        <Card className="bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
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

        <Card className="bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
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

        <Card className="bg-linear-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
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

        <Card className="bg-linear-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
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

      {/* Gráfico de ventas por hora */}
      {hourlyChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ventas por Hora</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-gray-200 dark:stroke-gray-700"
                />
                <XAxis
                  dataKey="hour"
                  className="text-xs fill-gray-600 dark:fill-gray-400"
                />
                <YAxis className="text-xs fill-gray-600 dark:fill-gray-400" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === "amount") {
                      return [formatCurrency(value), "Monto"];
                    }
                    return [value, "Ventas"];
                  }}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {hourlyChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

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
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
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
                      <div className="font-medium text-gray-900 dark:text-white">
                        {getPaymentMethodName(item.method)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {item.count}{" "}
                        {item.count === 1 ? "transacción" : "transacciones"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 dark:text-white">
                      {formatCurrency(item.amount)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
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
