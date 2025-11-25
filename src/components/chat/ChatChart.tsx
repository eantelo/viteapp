import { useMemo, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface ChartData {
  type: "bar" | "line";
  title: string;
  dataKey: string;
  labelKey: string;
  data: Record<string, unknown>[];
  summary?: {
    totalSales?: number;
    totalTransactions?: number;
    averageDaily?: number;
    totalProducts?: number;
    totalQuantity?: number;
    totalRevenue?: number;
  };
}

interface ChatChartProps {
  chartData: ChartData;
}

// Formateador de moneda para tooltips
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Formateador de números
const formatNumber = (value: number) => {
  return new Intl.NumberFormat("es-MX").format(value);
};

// Tooltip personalizado
function CustomTooltip({
  active,
  payload,
  label,
  dataKey,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string }[];
  label?: string;
  dataKey: string;
}) {
  if (!active || !payload || !payload.length) return null;

  const value = payload[0].value;
  const isMonetary = dataKey === "total" || dataKey === "revenue";

  return (
    <div className="rounded-lg border bg-card dark:bg-card px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-primary">
        {isMonetary ? formatCurrency(value) : formatNumber(value)}
        {!isMonetary && dataKey === "quantity" && " unidades"}
      </p>
    </div>
  );
}

export function ChatChart({ chartData }: ChatChartProps) {
  const { type, title, dataKey, labelKey, data, summary } = chartData;

  // Determinar si los valores son monetarios
  const isMonetary = dataKey === "total" || dataKey === "revenue";

  // Detectar modo oscuro y obtener colores reales
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Verificar si está en modo oscuro
    const checkDarkMode = () => {
      const isDarkMode = document.documentElement.classList.contains("dark");
      setIsDark(isDarkMode);
    };

    checkDarkMode();

    // Observar cambios en la clase del documento
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Colores que funcionan en SVG
  const chartColor = isDark ? "#60a5fa" : "#3b82f6"; // blue-400 / blue-500
  const chartColorLight = isDark
    ? "rgba(96, 165, 250, 0.2)"
    : "rgba(59, 130, 246, 0.2)";
  const gridColor = isDark ? "#374151" : "#e5e7eb"; // gray-700 / gray-200
  const textColor = isDark ? "#9ca3af" : "#6b7280"; // gray-400 / gray-500

  // Calcular el máximo para el eje Y
  const maxValue = useMemo(() => {
    const values = data.map((d) => Number(d[dataKey]) || 0);
    return Math.max(...values) * 1.1; // 10% extra para padding
  }, [data, dataKey]);

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 10, right: 10, left: 0, bottom: 0 },
    };

    const commonXAxis = (
      <XAxis
        dataKey={labelKey}
        tick={{ fontSize: 10, fill: textColor }}
        tickLine={false}
        axisLine={false}
        interval={data.length > 10 ? Math.floor(data.length / 7) : 0}
      />
    );

    const commonYAxis = (
      <YAxis
        tick={{ fontSize: 10, fill: textColor }}
        tickLine={false}
        axisLine={false}
        width={50}
        tickFormatter={(value) =>
          isMonetary ? `$${(value / 1000).toFixed(0)}k` : formatNumber(value)
        }
        domain={[0, maxValue]}
      />
    );

    const commonTooltip = (
      <Tooltip
        content={<CustomTooltip dataKey={dataKey} />}
        cursor={{ fill: chartColorLight }}
      />
    );

    if (type === "line") {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke={gridColor}
          />
          {commonXAxis}
          {commonYAxis}
          {commonTooltip}
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={chartColor}
            strokeWidth={2}
            dot={{ fill: chartColor, r: 3 }}
            activeDot={{ r: 5, fill: chartColor }}
          />
        </LineChart>
      );
    }

    return (
      <BarChart {...commonProps}>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke={gridColor}
        />
        {commonXAxis}
        {commonYAxis}
        {commonTooltip}
        <Bar
          dataKey={dataKey}
          fill={chartColor}
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
      </BarChart>
    );
  };

  return (
    <Card className="w-full border-0 shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-2">
        <CardTitle className="text-sm font-medium text-foreground">
          📊 {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>

        {/* Resumen */}
        {summary && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {summary.totalSales !== undefined && (
              <div className="rounded-md bg-muted/50 dark:bg-muted/30 p-2">
                <p className="text-muted-foreground">Total Ventas</p>
                <p className="font-semibold text-foreground">
                  {formatCurrency(summary.totalSales)}
                </p>
              </div>
            )}
            {summary.totalTransactions !== undefined && (
              <div className="rounded-md bg-muted/50 dark:bg-muted/30 p-2">
                <p className="text-muted-foreground">Transacciones</p>
                <p className="font-semibold text-foreground">
                  {formatNumber(summary.totalTransactions)}
                </p>
              </div>
            )}
            {summary.averageDaily !== undefined && (
              <div className="rounded-md bg-muted/50 dark:bg-muted/30 p-2">
                <p className="text-muted-foreground">Promedio Diario</p>
                <p className="font-semibold text-foreground">
                  {formatCurrency(summary.averageDaily)}
                </p>
              </div>
            )}
            {summary.totalQuantity !== undefined && (
              <div className="rounded-md bg-muted/50 dark:bg-muted/30 p-2">
                <p className="text-muted-foreground">Unidades</p>
                <p className="font-semibold text-foreground">
                  {formatNumber(summary.totalQuantity)}
                </p>
              </div>
            )}
            {summary.totalRevenue !== undefined && (
              <div className="rounded-md bg-muted/50 dark:bg-muted/30 p-2">
                <p className="text-muted-foreground">Ingresos</p>
                <p className="font-semibold text-foreground">
                  {formatCurrency(summary.totalRevenue)}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
