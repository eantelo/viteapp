import { useEffect, useState, useMemo, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageTransition } from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MagnifyingGlass,
  Eye,
  Printer,
  Trash,
  ArrowsClockwise,
  FilePdf,
  FileXls,
  ArrowCounterClockwise,
  Plus,
  PencilSimple,
  Lock,
  Money,
  Package,
  PaperPlaneTilt,
  Receipt,
  SpinnerGap,
  Funnel,
  CaretDown,
  CaretUp,
  DotsThreeVertical,
} from "@phosphor-icons/react";
import type { SaleDto } from "@/api/salesApi";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  getSalesHistory,
  getSalesStatistics,
  deleteSale,
  downloadInvoicePdf,
  downloadShippingLabels,
  refundSale,
  closeSale,
  sendSaleToTrello,
} from "@/api/salesApi";
import type { SalesStatistics, SalesHistoryParams } from "@/api/salesApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { DatePresetButtons } from "@/components/sales/DatePresetButtons";
import { SalesStatisticsCards } from "@/components/sales/SalesStatisticsCards";
import { SaleDetailModal } from "@/components/sales/SaleDetailModal";
import type { DatePreset } from "@/types/salesHistory";
import { exportToExcel, exportToPDF } from "@/utils/salesExport";
import {
  getTodayDateString,
  getYesterdayDateString,
  getMonthStartDateString,
  formatDateToISO,
  dateRangeToUTC,
} from "@/utils/dateUtils";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/shared";
import { PAGE_LAYOUT_CLASS } from "@/lib/constants";

export function SalesPage() {
  useDocumentTitle("Gestión de Ventas");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reportSectionRef = useRef<HTMLDivElement | null>(null);

  const [sales, setSales] = useState<SaleDto[]>([]);
  const [statistics, setStatistics] = useState<SalesStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Leer parámetro de búsqueda inicial desde la URL
  const initialSearch = searchParams.get("search") ?? "";

  // Filtros
  const [search, setSearch] = useState(initialSearch);
  const [datePreset, setDatePreset] = useState<DatePreset>(
    initialSearch ? "thisMonth" : "today"
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<number | undefined>();
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [status, setStatus] = useState<string>("all");

  // UI state
  const [selectedSale, setSelectedSale] = useState<SaleDto | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSaleIds, setSelectedSaleIds] = useState<string[]>([]);
  const [sendingToTrelloIds, setSendingToTrelloIds] = useState<Set<string>>(
    new Set()
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedMobileActions, setExpandedMobileActions] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Calcular fechas según el preset seleccionado
  const getDateRangeFromPreset = (preset: DatePreset) => {
    switch (preset) {
      case "today":
        return {
          from: getTodayDateString(),
          to: getTodayDateString(),
        };
      case "yesterday":
        return {
          from: getYesterdayDateString(),
          to: getYesterdayDateString(),
        };
      case "thisWeek": {
        const today = getTodayDateString();
        const todayDate = new Date();
        const dayOfWeek = todayDate.getDay();
        const diff = todayDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(todayDate.getFullYear(), todayDate.getMonth(), diff);
        return {
          from: formatDateToISO(monday),
          to: today,
        };
      }
      case "thisMonth": {
        const today = getTodayDateString();
        const firstDay = getMonthStartDateString();
        return {
          from: firstDay,
          to: today,
        };
      }
      case "custom":
        return { from: dateFrom, to: dateTo };
      default:
        return { from: "", to: "" };
    }
  };

  // Cargar datos
  const loadData = async () => {
    try {
      setLoading(true);
      setStatsLoading(true);
      setError(null);

      const dateRange = getDateRangeFromPreset(datePreset);
      // Convertir fechas locales a UTC ISO strings para enviar al servidor
      const utcDateRange = dateRangeToUTC(dateRange.from, dateRange.to);

      const params: SalesHistoryParams = {
        dateFrom: utcDateRange.from,
        dateTo: utcDateRange.to,
        limit: 50,
      };

      if (customerId) params.customerId = customerId;
      if (paymentMethod !== undefined) params.paymentMethod = paymentMethod;
      if (minAmount) params.minAmount = parseFloat(minAmount);
      if (maxAmount) params.maxAmount = parseFloat(maxAmount);

      // Cargar ventas y estadísticas en paralelo
      const [salesData, statsData] = await Promise.all([
        getSalesHistory(params),
        getSalesStatistics(utcDateRange.from, utcDateRange.to),
      ]);

      setSales(salesData);
      setStatistics(statsData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar el historial"
      );
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [datePreset]);

  // Filtrar ventas por búsqueda
  const filteredSales = useMemo(() => {
    const searchLower = search.toLowerCase();
    return sales.filter((sale) => {
      const matchesSearch =
        !search ||
        sale.saleNumber.toString().includes(searchLower) ||
        sale.customerName?.toLowerCase().includes(searchLower);

      const matchesStatus = status === "all" || sale.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [sales, search, status]);

  const reportSales = useMemo(
    () => filteredSales.filter((sale) => sale.status !== "Refunded"),
    [filteredSales]
  );

  const excludedRefundedSalesCount = filteredSales.length - reportSales.length;

  const salesByItemByDate = useMemo(() => {
    const grouped = new Map<
      string,
      {
        date: string;
        productId: string;
        productName: string;
        quantity: number;
        amount: number;
      }
    >();

    for (const sale of reportSales) {
      const saleDate = new Date(sale.date);
      if (Number.isNaN(saleDate.getTime())) continue;

      const year = saleDate.getFullYear();
      const month = String(saleDate.getMonth() + 1).padStart(2, "0");
      const dayOfMonth = String(saleDate.getDate()).padStart(2, "0");
      const day = `${year}-${month}-${dayOfMonth}`;

      for (const item of sale.items) {
        const productId = item.productId || "unknown";
        const productName =
          item.productName?.trim() || `Producto ${item.productId?.slice(0, 8) || "N/A"}`;
        const key = `${day}|${productId}`;
        const quantity = item.quantity || 0;
        const amount = (item.quantity || 0) * (item.price || 0);

        const current = grouped.get(key);
        if (current) {
          current.quantity += quantity;
          current.amount += amount;
        } else {
          grouped.set(key, {
            date: day,
            productId,
            productName,
            quantity,
            amount,
          });
        }
      }
    }

    return Array.from(grouped.values()).sort((a, b) => {
      if (a.date !== b.date) {
        return a.date < b.date ? 1 : -1;
      }

      if (a.amount !== b.amount) {
        return b.amount - a.amount;
      }

      return a.productName.localeCompare(b.productName, "es", {
        sensitivity: "base",
      });
    });
  }, [reportSales]);

  // Handlers
  const handleDatePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
  };

  const handleApplyFilters = () => {
    loadData();
  };

  const handleClearFilters = () => {
    setDatePreset("today");
    setSearch("");
    setCustomerId("");
    setPaymentMethod(undefined);
    setMinAmount("");
    setMaxAmount("");
    setStatus("all");
    setDateFrom("");
    setDateTo("");
  };

  const handleViewDetail = (sale: SaleDto) => {
    setSelectedSale(sale);
    setDetailModalOpen(true);
  };

  const handlePrint = async (sale: SaleDto) => {
    try {
      toast.info("Generando factura...");
      await downloadInvoicePdf(sale.id);
      toast.success("Factura descargada");
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Error al descargar la factura"
      );
    }
  };

  const handleSendToTrello = async (sale: SaleDto) => {
    if (
      !confirm(
        `¿Enviar la venta #${sale.saleNumber} a Trello con los datos del cliente y el detalle de la orden?`
      )
    ) {
      return;
    }

    if (sendingToTrelloIds.has(sale.id)) {
      return;
    }

    setSendingToTrelloIds((prev) => {
      const next = new Set(prev);
      next.add(sale.id);
      return next;
    });

    try {
      await sendSaleToTrello(sale.id);
      toast.success("Venta enviada a Trello", {
        description: `Orden #${sale.saleNumber}`,
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al enviar la venta a Trello"
      );
    } finally {
      setSendingToTrelloIds((prev) => {
        const next = new Set(prev);
        next.delete(sale.id);
        return next;
      });
    }
  };

  const handleRefund = async (sale: SaleDto) => {
    if (
      !confirm(
        `¿Estás seguro de reembolsar la venta #${sale.saleNumber}?\n\nEl stock será devuelto al inventario. Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      await refundSale(sale.id);
      toast.success("Venta reembolsada correctamente");
      loadData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al reembolsar la venta"
      );
    }
  };

  const handleClose = async (sale: SaleDto) => {
    if (
      !confirm(
        `¿Cerrar contablemente la venta #${sale.saleNumber}?\n\nUna vez cerrada, no podrá ser modificada ni reembolsada.`
      )
    ) {
      return;
    }

    try {
      await closeSale(sale.id);
      toast.success("Venta cerrada correctamente");
      loadData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al cerrar la venta"
      );
    }
  };

  const handleDelete = async (sale: SaleDto) => {
    if (
      !confirm(
        `¿Eliminar permanentemente la venta #${sale.saleNumber}?\n\nEsta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      await deleteSale(sale.id);
      toast.success("Venta eliminada correctamente");
      loadData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al eliminar la venta"
      );
    }
  };

  const handleRepeatSale = (sale: SaleDto) => {
    // Navegar al POS con los productos de esta venta
    const items = sale.items.map((item) => ({
      productId: item.productId,
      productName: item.productName || "",
      quantity: item.quantity,
      price: item.price,
    }));

    // Guardar en localStorage temporalmente
    localStorage.setItem("repeatSaleItems", JSON.stringify(items));
    toast.success("Productos copiados. Redirigiendo al punto de venta...");

    // Navegar al POS
    setTimeout(() => {
      navigate("/pos");
    }, 500);
  };

  const handleToggleSelection = (saleId: string) => {
    setSelectedSaleIds((prev) =>
      prev.includes(saleId)
        ? prev.filter((id) => id !== saleId)
        : [...prev, saleId]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedSaleIds.length === filteredSales.length) {
      setSelectedSaleIds([]);
    } else {
      setSelectedSaleIds(filteredSales.map((sale) => sale.id));
    }
  };

  const handleGenerateShippingLabels = async () => {
    if (selectedSaleIds.length === 0) {
      toast.error("Debe seleccionar al menos una venta");
      return;
    }

    try {
      toast.info("Generando etiquetas de envío...");
      await downloadShippingLabels(selectedSaleIds);
      toast.success("Etiquetas descargadas correctamente");
      setSelectedSaleIds([]);
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Error al generar las etiquetas de envío"
      );
    }
  };

  const handleExportExcel = () => {
    exportToExcel(filteredSales, statistics || undefined);
    toast.success("Exportado a Excel correctamente");
  };

  const handleExportPDF = () => {
    exportToPDF(filteredSales, statistics || undefined);
    toast.success("Exportando a PDF...");
  };

  const handleCreate = () => {
    navigate("/sales/new");
  };

  const handleScrollToReport = () => {
    reportSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleEdit = (sale: SaleDto) => {
    navigate(`/sales/${sale.id}/edit`);
  };

  // Formateo
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("es-MX", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatDateShort = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(`${dateString}T00:00:00`);
    if (isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  };

  const getPaymentMethodsLabel = (sale: SaleDto) => {
    if (!sale.payments || sale.payments.length === 0) return "-";

    const methods = sale.payments.map((p) => {
      const namesByValue: Record<number, string> = {
        0: "Efectivo",
        1: "Tarjeta",
        2: "Voucher",
        3: "Transferencia",
        4: "Otro",
      };
      const namesByKey: Record<string, string> = {
        Cash: "Efectivo",
        Card: "Tarjeta",
        Voucher: "Voucher",
        Transfer: "Transferencia",
        Other: "Otro",
      };

      if (typeof p.method === "number") {
        return namesByValue[p.method] ?? "Desconocido";
      }

      if (typeof p.method === "string") {
        const trimmed = String(p.method).trim();
        if (trimmed in namesByKey) {
          return namesByKey[trimmed];
        }

        const parsed = Number(trimmed);
        if (!Number.isNaN(parsed) && namesByValue[parsed]) {
          return namesByValue[parsed];
        }
      }

      return "Desconocido";
    });

    return methods.join(", ");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        label: string;
        className?: string;
      }
    > = {
      Pending: {
        variant: "outline",
        label: "Pendiente",
        className:
          "border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950",
      },
      Completed: {
        variant: "default",
        label: "Completada",
        className: "bg-green-600 hover:bg-green-700",
      },
      Closed: {
        variant: "secondary",
        label: "Cerrada",
      },
      Cancelled: { variant: "destructive", label: "Cancelada" },
      Refunded: {
        variant: "outline",
        label: "Reembolsada",
        className:
          "border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950",
      },
    };

    const config = variants[status] || {
      variant: "secondary" as const,
      label: status,
    };
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <PageTransition>
      <DashboardLayout
        breadcrumbs={[
          { label: "Panel principal", href: "/dashboard" },
          { label: "Ventas" },
        ]}
        className={PAGE_LAYOUT_CLASS}
      >
        {/* Header */}
        <PageHeader
          icon={Receipt}
          title="Gestión de Ventas"
          description={isMobile ? undefined : "Gestión completa de órdenes de venta"}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {selectedSaleIds.length > 0 && (
                <Button
                  variant="default"
                  onClick={handleGenerateShippingLabels}
                  className="gap-2 text-sm"
                  aria-label={`Generar etiquetas para ${selectedSaleIds.length} ventas`}
                  title="Generar etiquetas de envío"
                >
                  <Package size={20} weight="bold" />
                  <span className="hidden sm:inline">Etiquetas ({selectedSaleIds.length})</span>
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleExportExcel}
                className="gap-2 text-sm"
                disabled={filteredSales.length === 0}
                aria-label="Exportar a Excel"
                title="Exportar a Excel"
              >
                <FileXls size={20} weight="bold" />
                <span className="hidden sm:inline">Excel</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleExportPDF}
                className="gap-2 text-sm"
                disabled={filteredSales.length === 0}
                aria-label="Exportar a PDF"
                title="Exportar a PDF"
              >
                <FilePdf size={20} weight="bold" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
              <Button onClick={loadData} className="gap-2 text-sm" variant="outline" aria-label="Actualizar datos" title="Actualizar">
                <ArrowCounterClockwise size={20} weight="bold" />
                <span className="hidden sm:inline">Actualizar</span>
              </Button>
              <Button
                onClick={handleScrollToReport}
                className="gap-2 text-sm"
                variant="outline"
                aria-label="Ir al reporte por ítem y fecha"
                title="Ver reporte"
              >
                <Receipt size={20} weight="bold" />
                <span className="hidden sm:inline">Ver reporte</span>
              </Button>
              <Button onClick={handleCreate} className="gap-2 text-sm">
                <Plus size={20} weight="bold" />
                <span className="hidden sm:inline">Nueva Orden</span>
              </Button>
            </div>
          }
        />

        {/* Estadísticas */}
        <SalesStatisticsCards statistics={statistics} loading={statsLoading} />

        {/* Reporte: ventas por ítem por fecha */}
        <Card
          ref={reportSectionRef}
          className="mt-4 border-border bg-card shadow-none"
        >
          <CardHeader className="space-y-1">
            <CardTitle className="text-base font-semibold">
              Reporte de Ventas por Ítem y Fecha
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Consolidado por producto y día usando los filtros aplicados, excluyendo ventas reembolsadas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <SpinnerGap size={36} weight="bold" className="animate-spin text-primary" />
              </div>
            ) : salesByItemByDate.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                No hay datos para el reporte con los filtros actuales.
              </div>
            ) : (
              <>
                <div className="mb-3 text-xs text-muted-foreground">
                  {salesByItemByDate.length} {salesByItemByDate.length === 1 ? "registro" : "registros"}
                </div>

                {excludedRefundedSalesCount > 0 && (
                  <div className="mb-3 rounded-md border border-purple-500/30 bg-purple-500/5 px-3 py-2 text-xs text-muted-foreground">
                    Se {excludedRefundedSalesCount === 1 ? "excluyó" : "excluyeron"} {excludedRefundedSalesCount} {excludedRefundedSalesCount === 1 ? "venta reembolsada" : "ventas reembolsadas"} del consolidado.
                  </div>
                )}

                {/* Móvil */}
                <div className="space-y-2 md:hidden">
                  {salesByItemByDate.map((row) => (
                    <div
                      key={`${row.date}-${row.productId}`}
                      className="rounded-lg border border-border bg-muted/20 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{row.productName}</p>
                          <p className="text-xs text-muted-foreground">{formatDateShort(row.date)}</p>
                        </div>
                        <p className="text-sm font-semibold tabular-nums">{formatCurrency(row.amount)}</p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Cantidad: <span className="font-mono tabular-nums">{row.quantity}</span>
                      </p>
                    </div>
                  ))}
                </div>

                {/* Desktop */}
                <div className="hidden md:block rounded-lg border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Fecha
                          </TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Ítem
                          </TableHead>
                          <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Cantidad
                          </TableHead>
                          <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Importe
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesByItemByDate.map((row) => (
                          <TableRow key={`${row.date}-${row.productId}`} className="hover:bg-muted/50">
                            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                              {formatDateShort(row.date)}
                            </TableCell>
                            <TableCell className="text-sm">{row.productName}</TableCell>
                            <TableCell className="text-right text-sm font-mono tabular-nums">
                              {row.quantity}
                            </TableCell>
                            <TableCell className="text-right text-sm font-semibold tabular-nums">
                              {formatCurrency(row.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Filtros y resultados */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 lg:gap-6">
          {/* Toggle filtros en móvil */}
          <div className="lg:hidden">
            <Button
              variant="outline"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="w-full justify-between gap-2 text-sm"
              aria-expanded={filtersOpen}
              aria-controls="sales-filters-panel"
              aria-label="Mostrar u ocultar filtros"
              title="Filtros"
            >
              <span className="flex items-center gap-2">
                <Funnel size={18} weight="bold" />
                Filtros
              </span>
              {filtersOpen ? <CaretUp size={16} /> : <CaretDown size={16} />}
            </Button>
          </div>

          {/* Panel de filtros */}
          <Card
            id="sales-filters-panel"
            className={cn(
              "h-fit border-border bg-card shadow-none",
              !filtersOpen && "hidden lg:block"
            )}
          >
            <CardHeader className="space-y-1">
              <CardTitle className="text-base font-semibold">
                Filtros
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Personaliza tu búsqueda de ventas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Rango de fechas */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Período
                </Label>
                <div className="rounded-lg border border-border bg-muted/30 p-2">
                  <DatePresetButtons
                    selected={datePreset}
                    onSelect={handleDatePresetChange}
                  />
                </div>
                {datePreset === "custom" && (
                  <div className="space-y-2 mt-3">
                    <div>
                      <Label htmlFor="date-from" className="text-xs text-muted-foreground">
                        Desde
                      </Label>
                      <Input
                        id="date-from"
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="date-to" className="text-xs text-muted-foreground">
                        Hasta
                      </Label>
                      <Input
                        id="date-to"
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Filtro de Estado */}
              <div className="space-y-2">
                <Label
                  htmlFor="status-filter"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Estado
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Pending">Pendiente</SelectItem>
                    <SelectItem value="Completed">Completada</SelectItem>
                    <SelectItem value="Closed">Cerrada</SelectItem>
                    <SelectItem value="Cancelled">Cancelada</SelectItem>
                    <SelectItem value="Refunded">Reembolsada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Método de pago */}
              <div className="space-y-2">
                <Label
                  htmlFor="payment-method"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Método de Pago
                </Label>
                <Select
                  value={paymentMethod?.toString() || "all"}
                  onValueChange={(value) =>
                    setPaymentMethod(
                      value === "all" ? undefined : parseInt(value)
                    )
                  }
                >
                  <SelectTrigger id="payment-method">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="0">Efectivo</SelectItem>
                    <SelectItem value="1">Tarjeta</SelectItem>
                    <SelectItem value="2">Voucher</SelectItem>
                    <SelectItem value="3">Transferencia</SelectItem>
                    <SelectItem value="4">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Rango de monto */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Rango de Monto
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="min-amount" className="text-xs text-muted-foreground">
                      Mínimo
                    </Label>
                    <Input
                      id="min-amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-amount" className="text-xs text-muted-foreground">
                      Máximo
                    </Label>
                    <Input
                      id="max-amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col gap-2 pt-1">
                <Button onClick={handleApplyFilters} className="w-full text-sm">
                  Aplicar Filtros
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="w-full text-sm"
                >
                  Limpiar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de ventas */}
          <Card className="border-border bg-card shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base font-semibold">
                Ventas Encontradas
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {filteredSales.length}{" "}
                {filteredSales.length === 1 ? "venta" : "ventas"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Búsqueda rápida */}
              <div className="mb-4">
                <div className="relative">
                  <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por #Orden o Cliente..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                    aria-label="Buscar ventas"
                  />
                </div>
              </div>

              {/* Loading / Error / Empty */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <SpinnerGap size={40} weight="bold" className="animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="text-center py-12 text-destructive">{error}</div>
              ) : filteredSales.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No se encontraron ventas con los filtros aplicados
                </div>
              ) : (
                <>
                  {/* ===== Vista móvil: tarjetas ===== */}
                  <div className="space-y-3 md:hidden">
                    {/* Select all on mobile */}
                    <div className="flex items-center gap-2 pb-1">
                      <input
                        type="checkbox"
                        checked={
                          filteredSales.length > 0 &&
                          selectedSaleIds.length === filteredSales.length
                        }
                        onChange={handleToggleSelectAll}
                        className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                        aria-label="Seleccionar todas las ventas"
                      />
                      <span className="text-xs text-muted-foreground">Seleccionar todas</span>
                    </div>

                    {filteredSales.map((sale) => (
                      <div
                        key={sale.id}
                        className="rounded-lg border border-border bg-card p-4 active:scale-[0.99] transition-transform"
                      >
                        {/* Row 1: checkbox + order# + status + total */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={selectedSaleIds.includes(sale.id)}
                              onChange={() => handleToggleSelection(sale.id)}
                              className="h-5 w-5 shrink-0 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                              aria-label={`Seleccionar venta #${sale.saleNumber}`}
                            />
                            <div className="min-w-0">
                              <span className="font-mono text-sm font-semibold tabular-nums">
                                #{sale.saleNumber}
                              </span>
                            </div>
                          </div>
                          <span className="text-base font-semibold tabular-nums font-mono shrink-0">
                            {formatCurrency(sale.total)}
                          </span>
                        </div>

                        {/* Row 2: customer + date + status */}
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                          <span className="text-foreground truncate max-w-40">
                            {sale.customerName || "Sin cliente"}
                          </span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDateTime(sale.date)}
                          </span>
                          {getStatusBadge(sale.status)}
                        </div>

                        {/* Row 3: payment method + product count */}
                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{getPaymentMethodsLabel(sale)}</span>
                          <span>·</span>
                          <span className="tabular-nums">
                            {sale.items.reduce((sum, item) => sum + item.quantity, 0)} productos
                          </span>
                        </div>

                        {/* Row 4: actions */}
                        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(sale)}
                            aria-label="Ver detalle"
                            title="Ver detalle"
                            className="min-h-11 min-w-11"
                          >
                            <Eye size={20} weight="bold" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendToTrello(sale)}
                            disabled={sendingToTrelloIds.has(sale.id)}
                            aria-label={
                              sendingToTrelloIds.has(sale.id)
                                ? "Enviando venta a Trello"
                                : "Enviar venta a Trello"
                            }
                            title={
                              sendingToTrelloIds.has(sale.id)
                                ? "Enviando a Trello..."
                                : "Enviar venta a Trello"
                            }
                            className="min-h-11 gap-2 border-sky-500/40 px-3 text-sky-600 hover:text-sky-700"
                          >
                            {sendingToTrelloIds.has(sale.id) ? (
                              <SpinnerGap size={20} weight="bold" className="animate-spin" />
                            ) : (
                              <PaperPlaneTilt size={20} weight="bold" />
                            )}
                            <span className="text-sm font-medium">Trello</span>
                          </Button>

                          {sale.status === "Pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(sale)}
                                aria-label="Editar venta"
                                title="Editar venta"
                                className="min-h-11 min-w-11 text-blue-600 hover:text-blue-700"
                              >
                                <PencilSimple size={20} weight="bold" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(sale)}
                                aria-label="Borrar orden"
                                title="Borrar orden"
                                className="min-h-11 min-w-11 text-error hover:text-error"
                              >
                                <Trash size={20} weight="bold" />
                              </Button>
                            </>
                          )}

                          {sale.status === "Completed" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePrint(sale)}
                                aria-label="Reimprimir factura"
                                title="Reimprimir factura"
                                className="min-h-11 min-w-11"
                              >
                                <Printer size={20} weight="bold" />
                              </Button>
                              {/* Expandable actions for Completed */}
                              <div className="relative ml-auto">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setExpandedMobileActions(
                                      expandedMobileActions === sale.id ? null : sale.id
                                    )
                                  }
                                  aria-label="Más acciones"
                                  title="Más acciones"
                                  className="min-h-11 min-w-11"
                                >
                                  <DotsThreeVertical size={20} weight="bold" />
                                </Button>
                                {expandedMobileActions === sale.id && (
                                  <div className="absolute right-0 top-full z-10 mt-1 flex flex-col rounded-lg border border-border bg-card p-1 shadow-lg">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        handleRepeatSale(sale);
                                        setExpandedMobileActions(null);
                                      }}
                                      className="justify-start gap-2 text-green-600 hover:text-green-700 min-h-11"
                                    >
                                      <ArrowsClockwise size={18} weight="bold" />
                                      Repetir
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        handleClose(sale);
                                        setExpandedMobileActions(null);
                                      }}
                                      className="justify-start gap-2 min-h-11"
                                    >
                                      <Lock size={18} weight="bold" />
                                      Cerrar
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        handleRefund(sale);
                                        setExpandedMobileActions(null);
                                      }}
                                      className="justify-start gap-2 text-purple-600 hover:text-purple-700 min-h-11"
                                    >
                                      <Money size={18} weight="bold" />
                                      Reembolsar
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </>
                          )}

                          {sale.status === "Closed" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePrint(sale)}
                                aria-label="Reimprimir factura"
                                title="Reimprimir factura"
                                className="min-h-11 min-w-11"
                              >
                                <Printer size={20} weight="bold" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRepeatSale(sale)}
                                aria-label="Repetir venta"
                                title="Repetir venta"
                                className="min-h-11 min-w-11 text-green-600 hover:text-green-700"
                              >
                                <ArrowsClockwise size={20} weight="bold" />
                              </Button>
                            </>
                          )}

                          {(sale.status === "Cancelled" || sale.status === "Refunded") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRepeatSale(sale)}
                              aria-label="Repetir venta"
                              title="Repetir venta"
                              className="min-h-11 min-w-11 text-green-600 hover:text-green-700"
                            >
                              <ArrowsClockwise size={20} weight="bold" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ===== Vista desktop: tabla ===== */}
                  <div className="hidden md:block rounded-lg border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="w-12">
                              <input
                                type="checkbox"
                                checked={
                                  filteredSales.length > 0 &&
                                  selectedSaleIds.length === filteredSales.length
                                }
                                onChange={handleToggleSelectAll}
                                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                                aria-label="Seleccionar todas las ventas"
                              />
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Orden #
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Fecha/Hora
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Cliente
                            </TableHead>
                            <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Total
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Método Pago
                            </TableHead>
                            <TableHead className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Productos
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Estado
                            </TableHead>
                            <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Acciones
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSales.map((sale) => (
                            <TableRow
                              key={sale.id}
                              className="hover:bg-muted/50"
                            >
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={selectedSaleIds.includes(sale.id)}
                                  onChange={() => handleToggleSelection(sale.id)}
                                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                                  aria-label={`Seleccionar venta #${sale.saleNumber}`}
                                />
                              </TableCell>
                              <TableCell className="font-mono text-sm font-semibold tabular-nums">
                                #{sale.saleNumber}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                                {formatDateTime(sale.date)}
                              </TableCell>
                              <TableCell className="text-sm">
                                {sale.customerName || "Sin cliente"}
                              </TableCell>
                              <TableCell className="text-right text-sm font-semibold tabular-nums">
                                {formatCurrency(sale.total)}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {getPaymentMethodsLabel(sale)}
                              </TableCell>
                              <TableCell className="text-center text-sm font-mono tabular-nums">
                                {sale.items.reduce(
                                  (sum, item) => sum + item.quantity,
                                  0
                                )}
                              </TableCell>
                              <TableCell>{getStatusBadge(sale.status)}</TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewDetail(sale)}
                                    aria-label="Ver detalle"
                                    title="Ver detalle"
                                  >
                                    <Eye size={18} weight="bold" />
                                  </Button>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSendToTrello(sale)}
                                    disabled={sendingToTrelloIds.has(sale.id)}
                                    aria-label={
                                      sendingToTrelloIds.has(sale.id)
                                        ? "Enviando venta a Trello"
                                        : "Enviar venta a Trello"
                                    }
                                    title={
                                      sendingToTrelloIds.has(sale.id)
                                        ? "Enviando a Trello..."
                                        : "Enviar venta a Trello"
                                    }
                                    className="gap-1.5 border-sky-500/40 px-2 text-sky-600 hover:text-sky-700"
                                  >
                                    {sendingToTrelloIds.has(sale.id) ? (
                                      <SpinnerGap size={18} weight="bold" className="animate-spin" />
                                    ) : (
                                      <PaperPlaneTilt size={18} weight="bold" />
                                    )}
                                    <span className="font-medium">Trello</span>
                                  </Button>

                                  {sale.status === "Pending" && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEdit(sale)}
                                        aria-label="Editar venta"
                                        title="Editar venta"
                                        className="text-blue-600 hover:text-blue-700"
                                      >
                                        <PencilSimple size={18} weight="bold" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(sale)}
                                        aria-label="Borrar orden"
                                        title="Borrar orden"
                                        className="text-error hover:text-error"
                                      >
                                        <Trash size={18} weight="bold" />
                                      </Button>
                                    </>
                                  )}

                                  {sale.status === "Completed" && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handlePrint(sale)}
                                        aria-label="Reimprimir factura"
                                        title="Reimprimir factura"
                                      >
                                        <Printer size={18} weight="bold" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRepeatSale(sale)}
                                        aria-label="Repetir venta"
                                        title="Repetir venta"
                                        className="text-green-600 hover:text-green-700"
                                      >
                                        <ArrowsClockwise size={18} weight="bold" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleClose(sale)}
                                        aria-label="Cerrar contablemente"
                                        title="Cerrar contablemente"
                                      >
                                        <Lock size={18} weight="bold" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRefund(sale)}
                                        aria-label="Reembolsar venta"
                                        title="Reembolsar venta"
                                        className="text-purple-600 hover:text-purple-700"
                                      >
                                        <Money size={18} weight="bold" />
                                      </Button>
                                    </>
                                  )}

                                  {sale.status === "Closed" && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handlePrint(sale)}
                                        aria-label="Reimprimir factura"
                                        title="Reimprimir factura"
                                      >
                                        <Printer size={18} weight="bold" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRepeatSale(sale)}
                                        aria-label="Repetir venta"
                                        title="Repetir venta"
                                        className="text-green-600 hover:text-green-700"
                                      >
                                        <ArrowsClockwise size={18} weight="bold" />
                                      </Button>
                                    </>
                                  )}

                                  {(sale.status === "Cancelled" ||
                                    sale.status === "Refunded") && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRepeatSale(sale)}
                                      aria-label="Repetir venta"
                                      title="Repetir venta"
                                      className="text-green-600 hover:text-green-700"
                                    >
                                      <ArrowsClockwise size={18} weight="bold" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal de detalle */}
        <SaleDetailModal
          open={detailModalOpen}
          sale={selectedSale}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedSale(null);
          }}
          onPrint={handlePrint}
          onEdit={(sale) => {
            setDetailModalOpen(false);
            setSelectedSale(null);
            handleEdit(sale);
          }}
          onSendToTrello={handleSendToTrello}
          isSendingToTrello={selectedSale ? sendingToTrelloIds.has(selectedSale.id) : false}
        />
      </DashboardLayout>
    </PageTransition>
  );
}
