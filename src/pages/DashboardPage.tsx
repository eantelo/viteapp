import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageTransition } from "@/components/motion/PageTransition";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { SalesStatisticsCards } from "@/components/sales/SalesStatisticsCards";
import { RecentSalesActivity } from "@/components/analytics/RecentSalesActivity";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import {
  DateRangeSelector,
  type DateRange,
} from "@/components/analytics/DateRangeSelector";
import {
  getSalesStatistics,
  getSalesHistory,
  type SalesStatistics,
  type SaleDto,
} from "@/api/salesApi";
import { dateRangeToUTC, formatDateToISO } from "@/utils/dateUtils";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { PAGE_LAYOUT_CLASS } from "@/lib/constants";
import {
  ArrowClockwise,
  ChartLine,
  WarningCircle,
} from "@phosphor-icons/react";

const DASHBOARD_HISTORY_LIMIT = 200;
const RECENT_SALES_LIMIT = 5;

/** Displays the sales overview for the selected local date range. */
export function DashboardPage() {
  useDocumentTitle("SalesNet | Panel de Análisis");

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    );
    return { from: today, to: endOfDay };
  });

  const [statistics, setStatistics] = useState<SalesStatistics | null>(null);
  const [salesHistory, setSalesHistory] = useState<SaleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let isCurrentRequest = true;

    const fetchData = async () => {
      setLoading(true);
      setLoadError(null);
      setStatistics(null);
      setSalesHistory([]);

      try {
        const utcRange = dateRangeToUTC(
          formatDateToISO(dateRange.from),
          formatDateToISO(dateRange.to)
        );

        const [statsData, historyData] = await Promise.all([
          getSalesStatistics(utcRange.from, utcRange.to),
          getSalesHistory({
            dateFrom: utcRange.from,
            dateTo: utcRange.to,
            limit: DASHBOARD_HISTORY_LIMIT,
          }),
        ]);

        if (!isCurrentRequest) return;

        setStatistics(statsData);
        setSalesHistory(historyData);
      } catch (error) {
        if (!isCurrentRequest) return;

        console.error("Error fetching dashboard data:", error);
        setLoadError(
          "No se pudo actualizar el resumen. Revisa tu conexión e inténtalo de nuevo."
        );
        toast.error("Error al cargar datos del tablero");
      } finally {
        if (isCurrentRequest) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCurrentRequest = false;
    };
  }, [dateRange, retryKey]);

  const recentSales = useMemo(
    () =>
      [...salesHistory]
        .sort((left, right) => {
          const rightTime = new Date(right.date).getTime();
          const leftTime = new Date(left.date).getTime();
          return (Number.isFinite(rightTime) ? rightTime : 0) -
            (Number.isFinite(leftTime) ? leftTime : 0);
        })
        .slice(0, RECENT_SALES_LIMIT),
    [salesHistory]
  );

  return (
    <PageTransition>
      <DashboardLayout
        breadcrumbs={[{ label: "Panel de Análisis" }]}
        className={PAGE_LAYOUT_CLASS}
      >
        <PageHeader
          title="Tablero"
          description="Consulta ventas, cobros y actividad del periodo seleccionado."
          sectionLabel="Panel de análisis"
          icon={ChartLine}
          actions={
            <DateRangeSelector
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              className="w-full justify-self-end sm:w-auto"
            />
          }
        />

        {loadError ? (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm sm:flex-row sm:items-center"
          >
            <WarningCircle
              className="h-5 w-5 shrink-0 text-destructive"
              weight="duotone"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">
                No pudimos cargar los datos del tablero
              </p>
              <p className="mt-0.5 text-pretty text-muted-foreground">
                {loadError}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full shrink-0 sm:w-auto"
              onClick={() => setRetryKey((current) => current + 1)}
              disabled={loading}
            >
              <ArrowClockwise
                className={loading ? "motion-safe:animate-spin" : undefined}
                aria-hidden="true"
              />
              {loading ? "Reintentando…" : "Reintentar"}
            </Button>
          </div>
        ) : null}

        <div className="grid gap-6">
          <section
            aria-labelledby="dashboard-summary-title"
            className="grid gap-3"
          >
            <div>
              <h2
                id="dashboard-summary-title"
                className="text-base font-semibold tracking-tight text-foreground"
              >
                Resumen del periodo
              </h2>
              <p className="text-sm text-muted-foreground">
                Indicadores consolidados según el filtro de fechas.
              </p>
            </div>
            <SalesStatisticsCards statistics={statistics} loading={loading} />
          </section>

          <section
            aria-label="Tendencia y actividad de ventas"
            className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,0.85fr)]"
          >
            <ChartAreaInteractive
              sales={salesHistory}
              dateRange={dateRange}
              historyLimit={DASHBOARD_HISTORY_LIMIT}
              loading={loading}
            />
            <RecentSalesActivity sales={recentSales} loading={loading} />
          </section>
        </div>
      </DashboardLayout>
    </PageTransition>
  );
}
