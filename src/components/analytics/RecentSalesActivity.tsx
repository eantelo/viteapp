import type { SaleDto } from "@/api/salesApi";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentSalesActivityProps {
  sales: SaleDto[];
  loading?: boolean;
}

export function RecentSalesActivity({ sales, loading }: RecentSalesActivityProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "C";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const timeAgo = (date: string | Date) => {
    const now = new Date();
    const past = new Date(date);
    const msPerMinute = 60 * 1000;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;
    const elapsed = now.getTime() - past.getTime();

    if (elapsed < msPerMinute) {
      return 'hace un momento';
    } else if (elapsed < msPerHour) {
      return `hace ${Math.round(elapsed / msPerMinute)} min`;
    } else if (elapsed < msPerDay) {
      return `hace ${Math.round(elapsed / msPerHour)} h`;
    } else {
      return `hace ${Math.round(elapsed / msPerDay)} días`;
    }
  };

  if (loading) {
    return (
      <Card className="col-span-1 h-full rounded-lg border-border/60 bg-card shadow-none">
        <CardHeader className="gap-2">
          <CardTitle className="text-base font-semibold tracking-tight">
            Ventas recientes
          </CardTitle>
          <CardDescription>Últimas operaciones registradas</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="grid gap-1">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="ml-auto font-medium">
                <Skeleton className="h-4 w-[60px]" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 h-full rounded-lg border-border/60 bg-card shadow-none">
      <CardHeader className="gap-2">
        <CardTitle className="text-base font-semibold tracking-tight">
          Ventas recientes
        </CardTitle>
        <CardDescription>Últimas operaciones registradas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sales.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay ventas recientes en este periodo.
            </p>
          ) : (
            sales.map((sale) => (
              <div key={sale.id} className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-border/60">
                  <AvatarFallback className="bg-muted/40 text-xs font-semibold text-muted-foreground">
                    {getInitials(sale.customerName)}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none text-foreground">
                    {sale.customerName || "Cliente General"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {sale.items.length}{" "}
                    {sale.items.length === 1 ? "artículo" : "artículos"} •{" "}
                    {timeAgo(sale.date)}
                  </p>
                </div>
                <div className="ml-auto text-sm font-semibold text-foreground tabular-nums font-mono">
                  +{formatCurrency(sale.total)}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
