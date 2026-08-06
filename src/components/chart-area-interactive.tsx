"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { ChartLine } from "@phosphor-icons/react";

import type { SaleDto } from "@/api/salesApi";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/contexts/CurrencyContext";

export const description = "Tendencia de ventas del periodo seleccionado";

type TrendGranularity = "hour" | "day" | "month";

interface SalesTrendRange {
  from: Date;
  to: Date;
}

interface ChartAreaInteractiveProps {
  sales: SaleDto[];
  dateRange: SalesTrendRange;
  loading?: boolean;
  historyLimit?: number;
}

interface SalesTrendPoint {
  timestamp: number;
  total: number;
  count: number;
}

const countFormatter = new Intl.NumberFormat("es-MX");
const hourFormatter = new Intl.DateTimeFormat("es-MX", {
  hour: "2-digit",
  minute: "2-digit",
});
const dayFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
});
const monthFormatter = new Intl.DateTimeFormat("es-MX", {
  month: "short",
  year: "2-digit",
});
const fullDateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
});
const fullDateTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
});

const chartConfig = {
  total: {
    label: "Importe vendido",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

function getGranularity(dateRange: SalesTrendRange): TrendGranularity {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const durationInDays = Math.max(
    1,
    Math.ceil(
      (dateRange.to.getTime() - dateRange.from.getTime()) / millisecondsPerDay
    )
  );

  if (durationInDays <= 1) return "hour";
  if (durationInDays <= 62) return "day";
  return "month";
}

function getBucketStart(date: Date, granularity: TrendGranularity) {
  if (granularity === "hour") {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours()
    );
  }

  if (granularity === "day") {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function buildSalesTrend(
  sales: SaleDto[],
  dateRange: SalesTrendRange,
  granularity: TrendGranularity
) {
  const rangeStart = dateRange.from.getTime();
  const rangeEnd = dateRange.to.getTime();
  const buckets = new Map<number, SalesTrendPoint>();

  sales.forEach((sale) => {
    const saleDate = new Date(sale.date);
    const saleTime = saleDate.getTime();
    const saleTotal = Number(sale.accountingTotal ?? sale.total);

    if (
      !Number.isFinite(saleTime) ||
      !Number.isFinite(saleTotal) ||
      saleTime < rangeStart ||
      saleTime > rangeEnd
    ) {
      return;
    }

    const timestamp = getBucketStart(saleDate, granularity).getTime();
    const current = buckets.get(timestamp) ?? {
      timestamp,
      total: 0,
      count: 0,
    };

    current.total += saleTotal;
    current.count += 1;
    buckets.set(timestamp, current);
  });

  return [...buckets.values()].sort(
    (left, right) => left.timestamp - right.timestamp
  );
}

function formatBucket(timestamp: number, granularity: TrendGranularity) {
  const date = new Date(timestamp);
  if (granularity === "hour") return hourFormatter.format(date);
  if (granularity === "day") return dayFormatter.format(date);
  return monthFormatter.format(date);
}

function formatTooltipDate(
  timestamp: number,
  granularity: TrendGranularity
) {
  const date = new Date(timestamp);
  return granularity === "hour"
    ? fullDateTimeFormatter.format(date)
    : fullDateFormatter.format(date);
}

function getAggregationLabel(granularity: TrendGranularity) {
  if (granularity === "hour") return "Importe agrupado por hora";
  if (granularity === "day") return "Importe agrupado por día";
  return "Importe agrupado por mes";
}

/** Renders an accessible sales trend based on the dashboard history response. */
export function ChartAreaInteractive({
  sales,
  dateRange,
  loading = false,
  historyLimit,
}: ChartAreaInteractiveProps) {
  const { configuration, formatCurrency } = useCurrency();
  const gradientId = React.useId().replace(/:/g, "");
  const granularity = React.useMemo(
    () => getGranularity(dateRange),
    [dateRange]
  );
  const trendData = React.useMemo(
    () => buildSalesTrend(sales, dateRange, granularity),
    [dateRange, granularity, sales]
  );
  const transactionCount = trendData.reduce(
    (total, point) => total + point.count,
    0
  );
  const reachedHistoryLimit = Boolean(
    historyLimit && sales.length >= historyLimit
  );

  if (loading) {
    return (
      <Card
        className="h-full min-w-0 rounded-xl border-border/60 bg-card shadow-none"
        aria-busy="true"
      >
        <CardHeader className="gap-2">
          <CardTitle className="text-base font-semibold tracking-tight">
            Tendencia de ventas
          </CardTitle>
          <CardDescription>Cargando importes del periodo…</CardDescription>
        </CardHeader>
        <CardContent>
          <div role="status" aria-live="polite">
            <span className="sr-only">Cargando tendencia de ventas…</span>
            <Skeleton className="h-[250px] w-full rounded-lg motion-reduce:animate-none" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (trendData.length === 0) {
    return (
      <Card className="h-full min-w-0 rounded-xl border-border/60 bg-card shadow-none">
        <CardHeader className="gap-2">
          <CardTitle className="text-base font-semibold tracking-tight">
            Tendencia de ventas
          </CardTitle>
          <CardDescription>{getAggregationLabel(granularity)}</CardDescription>
        </CardHeader>
        <CardContent className="flex min-h-[250px] items-center justify-center">
          <div
            role="status"
            className="mx-auto max-w-sm text-center text-muted-foreground"
          >
            <ChartLine
              className="mx-auto h-8 w-8"
              weight="duotone"
              aria-hidden="true"
            />
            <p className="mt-3 font-medium text-foreground">
              Sin ventas en este periodo
            </p>
            <p className="mt-1 text-pretty text-sm">
              Cambia el rango de fechas para consultar otra ventana de actividad.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="@container/card h-full min-w-0 rounded-xl border-border/60 bg-card shadow-none">
      <CardHeader className="gap-2">
        <CardTitle className="text-base font-semibold tracking-tight">
          Tendencia de ventas
        </CardTitle>
        <CardDescription>
          {getAggregationLabel(granularity)} en el periodo seleccionado
        </CardDescription>
        <CardAction>
          <span
            className="inline-flex rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-xs font-medium tabular-nums text-muted-foreground"
            aria-label={`${countFormatter.format(transactionCount)} ${
              transactionCount === 1 ? "venta" : "ventas"
            } en el gráfico`}
          >
            {countFormatter.format(transactionCount)} {transactionCount === 1 ? "venta" : "ventas"}
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-2 sm:px-6 sm:pt-4">
        <div
          role="img"
          aria-label={`Gráfico de tendencia con ${countFormatter.format(
            transactionCount
          )} ${transactionCount === 1 ? "venta" : "ventas"}`}
        >
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart
              accessibilityLayer
              data={trendData}
              margin={{ left: 4, right: 4 }}
            >
              <defs>
                <linearGradient
                  id={gradientId}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--color-total)"
                    stopOpacity={0.55}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-total)"
                    stopOpacity={0.04}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={28}
                tickFormatter={(value) =>
                  formatBucket(Number(value), granularity)
                }
              />
              <ChartTooltip
                cursor={{ stroke: "var(--border)", strokeDasharray: "3 3" }}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(_, payload) => {
                      const point = payload?.[0]?.payload as
                        | SalesTrendPoint
                        | undefined;
                      return point
                        ? formatTooltipDate(point.timestamp, granularity)
                        : "";
                    }}
                    formatter={(value) => (
                      <>
                        <span className="text-muted-foreground">Importe</span>
                        <span className="ml-auto font-mono font-semibold tabular-nums text-foreground">
                          {formatCurrency(Number(value), configuration?.accountingCurrencyCode)}
                        </span>
                      </>
                    )}
                  />
                }
              />
              <Area
                dataKey="total"
                type="monotone"
                fill={`url(#${gradientId})`}
                stroke="var(--color-total)"
                strokeWidth={2}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        </div>
        {reachedHistoryLimit ? (
          <p className="px-2 pb-1 pt-3 text-pretty text-xs text-muted-foreground">
            La tendencia usa las {countFormatter.format(historyLimit ?? 0)} ventas
            más recientes del periodo.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
