import type { SaleDto } from "@/api/salesApi";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Receipt } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useCurrency } from "@/contexts/CurrencyContext";

interface RecentSalesActivityProps {
  sales: SaleDto[];
  loading?: boolean;
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat("es-MX", {
  numeric: "auto",
});
const absoluteDateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
});
const countFormatter = new Intl.NumberFormat("es-MX");
const saleStatusLabels: Record<SaleDto["status"], string> = {
  Pending: "Pendiente",
  Completed: "Completada",
  Closed: "Cerrada",
  Cancelled: "Cancelada",
  Refunded: "Reembolsada",
};

/** Shows at most the five most recent sales in the selected period. */
export function RecentSalesActivity({ sales, loading }: RecentSalesActivityProps) {
  const { formatCurrency } = useCurrency();

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
    if (!Number.isFinite(past.getTime())) return "Fecha no disponible";

    const differenceInSeconds = (past.getTime() - now.getTime()) / 1000;
    const absoluteDifference = Math.abs(differenceInSeconds);
    if (absoluteDifference < 60) return relativeTimeFormatter.format(0, "second");
    if (absoluteDifference < 60 * 60) {
      return relativeTimeFormatter.format(
        Math.round(differenceInSeconds / 60),
        "minute"
      );
    }
    if (absoluteDifference < 24 * 60 * 60) {
      return relativeTimeFormatter.format(
        Math.round(differenceInSeconds / (60 * 60)),
        "hour"
      );
    }
    if (absoluteDifference < 7 * 24 * 60 * 60) {
      return relativeTimeFormatter.format(
        Math.round(differenceInSeconds / (24 * 60 * 60)),
        "day"
      );
    }
    return absoluteDateFormatter.format(past);
  };

  const visibleSales = sales.slice(0, 5);

  if (loading) {
    return (
      <Card className="col-span-1 h-full rounded-xl border-border/60 bg-card shadow-none" aria-busy="true">
        <CardHeader className="gap-2">
          <CardTitle className="text-base font-semibold tracking-tight">
            Ventas recientes
          </CardTitle>
          <CardDescription>Últimas operaciones registradas</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6" role="status" aria-live="polite">
          <span className="sr-only">Cargando ventas recientes…</span>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full motion-reduce:animate-none" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32 max-w-full motion-reduce:animate-none" />
                <Skeleton className="h-3 w-24 max-w-full motion-reduce:animate-none" />
              </div>
              <Skeleton className="ml-auto h-4 w-16 shrink-0 motion-reduce:animate-none" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 h-full min-w-0 rounded-xl border-border/60 bg-card shadow-none">
      <CardHeader className="gap-2">
        <CardTitle className="text-base font-semibold tracking-tight">
          Ventas recientes
        </CardTitle>
        <CardDescription>Últimas operaciones registradas</CardDescription>
        <CardAction>
          <Button asChild variant="ghost" size="sm" className="-mr-2">
            <Link to="/sales">
              Ver historial
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {visibleSales.length === 0 ? (
          <div className="py-8 text-center" role="status">
            <Receipt className="mx-auto h-7 w-7 text-muted-foreground" weight="duotone" aria-hidden="true" />
            <p className="mt-2 text-sm font-medium text-foreground">
              Sin ventas recientes
            </p>
            <p className="mt-1 text-pretty text-sm text-muted-foreground">
              No se registraron operaciones en el periodo seleccionado.
            </p>
          </div>
        ) : (
          <ol className="space-y-5" aria-label="Cinco ventas más recientes">
            {visibleSales.map((sale) => {
              const customerName = sale.customerName?.trim() || "Cliente general";
              return (
                <li key={sale.id} className="flex min-w-0 items-center gap-3">
                  <Avatar className="h-9 w-9 shrink-0 border border-border/60" aria-hidden="true">
                    <AvatarFallback className="bg-muted/40 text-xs font-semibold text-muted-foreground">
                      {getInitials(customerName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-medium leading-none text-foreground" title={customerName}>
                      {customerName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      #{countFormatter.format(sale.saleNumber)} · {countFormatter.format(sale.items.length)}{" "}
                      {sale.items.length === 1 ? "artículo" : "artículos"} · {timeAgo(sale.date)}
                    </p>
                  </div>
                  <div className="max-w-[42%] shrink-0 text-right">
                    <p className="truncate font-mono text-sm font-semibold tabular-nums text-foreground" title={formatCurrency(sale.total, sale.currencyCode)}>
                      {formatCurrency(sale.total, sale.currencyCode)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {saleStatusLabels[sale.status]}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
