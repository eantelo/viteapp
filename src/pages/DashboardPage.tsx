import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageTransition } from "@/components/motion/PageTransition";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { SalesStatisticsCards } from "@/components/sales/SalesStatisticsCards";
import { RecentSalesActivity } from "@/components/analytics/RecentSalesActivity";
import { DateRangeSelector, type DateRange } from "@/components/analytics/DateRangeSelector";
import { getSalesStatistics, getSalesHistory, type SalesStatistics, type SaleDto } from "@/api/salesApi";
import { toast } from "sonner";

export function DashboardPage() {
  useDocumentTitle("SalesNet | Panel de Análisis");
  
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    return { from: today, to: endOfDay };
  });

  const [statistics, setStatistics] = useState<SalesStatistics | null>(null);
  const [recentSales, setRecentSales] = useState<SaleDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const fromStr = dateRange.from.toISOString();
        const toStr = dateRange.to.toISOString();

        const [statsData, historyData] = await Promise.all([
          getSalesStatistics(fromStr, toStr),
          getSalesHistory({ 
            dateFrom: fromStr, 
            dateTo: toStr, 
            limit: 5 
          })
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
        className="flex flex-1 flex-col gap-4 p-4 pt-0"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Tablero</h2>
          <div className="flex items-center space-x-2">
            <DateRangeSelector 
              dateRange={dateRange} 
              onDateRangeChange={setDateRange} 
            />
          </div>
        </div>

        <div className="space-y-4">
          <SalesStatisticsCards statistics={statistics} loading={loading} />
          
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            <RecentSalesActivity sales={recentSales} loading={loading} />
            {/* Placeholder for future charts like Top Products */}
          </div>
        </div>
      </DashboardLayout>
    </PageTransition>
  );
}
