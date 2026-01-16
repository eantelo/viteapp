import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageTransition } from "@/components/motion/PageTransition";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { SalesStatisticsCards } from "@/components/sales/SalesStatisticsCards";
import { RecentSalesActivity } from "@/components/analytics/RecentSalesActivity";
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
import { getTodayRangeUTC } from "@/utils/dateUtils";
import { toast } from "sonner";

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
  const [recentSales, setRecentSales] = useState<SaleDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Usar el rango de hoy en UTC
        const utcRange = getTodayRangeUTC();

        const [statsData, historyData] = await Promise.all([
          getSalesStatistics(utcRange.from, utcRange.to),
          getSalesHistory({
            dateFrom: utcRange.from,
            dateTo: utcRange.to,
            limit: 5,
          }),
        ]);

        setStatistics(statsData);
        setRecentSales(historyData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Error al cargar datos del tablero");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  return (
    <PageTransition>
      <DashboardLayout
        breadcrumbs={[{ label: "Panel de Análisis" }]}
        className="gap-6 p-6 pt-4"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Panel de análisis
            </p>
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Tablero
              </h2>
              <p className="text-sm text-muted-foreground">
                Resumen de ventas y actividad reciente en tiempo real.
              </p>
            </div>
          </div>
          <DateRangeSelector
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            className="justify-self-end"
          />
        </div>

        <div className="grid gap-6">
          <SalesStatisticsCards statistics={statistics} loading={loading} />

          <div className="grid gap-6 lg:grid-cols-2">
            <RecentSalesActivity sales={recentSales} loading={loading} />
            {/* Placeholder for future charts like Top Products */}
          </div>
        </div>
      </DashboardLayout>
    </PageTransition>
  );
}
