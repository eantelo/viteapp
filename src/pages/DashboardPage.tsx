import { useEffect, useState } from "react";
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
import { PAGE_LAYOUT_CLASS } from "@/lib/constants";
import { ChartLine } from "@phosphor-icons/react";

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
        const utcRange = dateRangeToUTC(
          formatDateToISO(dateRange.from),
          formatDateToISO(dateRange.to)
        );

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
        className={PAGE_LAYOUT_CLASS}
      >
        <PageHeader
          title="Tablero"
          description="Resumen de ventas y actividad reciente en tiempo real."
          sectionLabel="Panel de análisis"
          icon={ChartLine}
          actions={
            <DateRangeSelector
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              className="justify-self-end"
            />
          }
        />

        <div className="grid gap-6">
          <SalesStatisticsCards statistics={statistics} loading={loading} />

          <div className="grid gap-6 lg:grid-cols-2">
            <RecentSalesActivity sales={recentSales} loading={loading} />
            <ChartAreaInteractive />
          </div>
        </div>
      </DashboardLayout>
    </PageTransition>
  );
}
