import { useEffect, useState, useMemo } from "react";
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
  IconHistory,
  IconSearch,
  IconEye,
  IconPrinter,
  IconTrash,
  IconRepeat,
  IconFileTypePdf,
  IconFileSpreadsheet,
  IconRefresh,
  IconPlus,
  IconPencil,
  IconCheck,
  IconX,
  IconLock,
  IconCash,
} from "@tabler/icons-react";
import type { SaleDto } from "@/api/salesApi";
import {
  getSalesHistory,
  getSalesStatistics,
  deleteSale,
  downloadInvoicePdf,
  refundSale,
  closeSale,
} from "@/api/salesApi";
import type { SalesStatistics, SalesHistoryParams } from "@/api/salesApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { DatePresetButtons } from "@/components/sales/DatePresetButtons";
import { SalesStatisticsCards } from "@/components/sales/SalesStatisticsCards";
import { SaleDetailModal } from "@/components/sales/SaleDetailModal";
import type { DatePreset } from "@/types/salesHistory";
import { exportToExcel, exportToPDF } from "@/utils/salesExport";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";

export function SalesPage() {
  useDocumentTitle("Gestión de Ventas");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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

  // Calcular fechas según el preset seleccionado
  const getDateRangeFromPreset = (preset: DatePreset) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (preset) {
      case "today":
        return {
          from: today.toISOString().split("T")[0],
          to: today.toISOString().split("T")[0],
        };
      case "yesterday": {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          from: yesterday.toISOString().split("T")[0],
          to: yesterday.toISOString().split("T")[0],
        };
      }
      case "thisWeek": {
        const firstDay = new Date(today);
        firstDay.setDate(today.getDate() - today.getDay());
        return {
          from: firstDay.toISOString().split("T")[0],
          to: today.toISOString().split("T")[0],
        };
      }
      case "thisMonth": {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          from: firstDay.toISOString().split("T")[0],
          to: today.toISOString().split("T")[0],
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

      const params: SalesHistoryParams = {
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
        limit: 50,
      };

      if (customerId) params.customerId = customerId;
      if (paymentMethod !== undefined) params.paymentMethod = paymentMethod;
      if (minAmount) params.minAmount = parseFloat(minAmount);
      if (maxAmount) params.maxAmount = parseFloat(maxAmount);

      // Cargar ventas y estadísticas en paralelo
      const [salesData, statsData] = await Promise.all([
        getSalesHistory(params),
        getSalesStatistics(dateRange.from, dateRange.to),
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

  const getPaymentMethodsLabel = (sale: SaleDto) => {
    if (!sale.payments || sale.payments.length === 0) return "-";

    const methods = sale.payments.map((p) => {
      const names: Record<number, string> = {
        0: "Efectivo",
        1: "Tarjeta",
        2: "Voucher",
        3: "Transfer.",
        4: "Otro",
      };
      return names[p.method] || "?";
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
        className: "bg-slate-600 text-white",
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
        className="flex flex-1 flex-col gap-4 p-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
              <IconHistory className="h-8 w-8 text-primary" />
              Gestión de Ventas
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Gestión completa de órdenes de venta
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExportExcel}
              className="gap-2"
              disabled={filteredSales.length === 0}
            >
              <IconFileSpreadsheet size={20} />
              <span className="hidden sm:inline">Excel</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              className="gap-2"
              disabled={filteredSales.length === 0}
            >
              <IconFileTypePdf size={20} />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button onClick={loadData} className="gap-2" variant="outline">
              <IconRefresh size={20} />
              <span className="hidden sm:inline">Actualizar</span>
            </Button>
            <Button onClick={handleCreate} className="gap-2">
              <IconPlus size={20} />
              <span>Nueva Orden</span>
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <SalesStatisticsCards statistics={statistics} loading={statsLoading} />

        {/* Filtros y resultados */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
          {/* Panel de filtros */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Filtros</CardTitle>
              <CardDescription>
                Personaliza tu búsqueda de ventas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Rango de fechas */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Período</Label>
                <DatePresetButtons
                  selected={datePreset}
                  onSelect={handleDatePresetChange}
                />
                {datePreset === "custom" && (
                  <div className="space-y-2 mt-3">
                    <div>
                      <Label htmlFor="date-from" className="text-xs">
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
                      <Label htmlFor="date-to" className="text-xs">
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
                  className="text-sm font-semibold"
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
                  className="text-sm font-semibold"
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
                <Label className="text-sm font-semibold">Rango de Monto</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="min-amount" className="text-xs">
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
                    <Label htmlFor="max-amount" className="text-xs">
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
              <div className="flex flex-col gap-2 pt-2">
                <Button onClick={handleApplyFilters} className="w-full">
                  Aplicar Filtros
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="w-full"
                >
                  Limpiar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de ventas */}
          <Card>
            <CardHeader>
              <CardTitle>Ventas Encontradas</CardTitle>
              <CardDescription>
                {filteredSales.length}{" "}
                {filteredSales.length === 1 ? "venta" : "ventas"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Búsqueda rápida */}
              <div className="mb-4">
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Buscar por #Orden o Cliente..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Tabla */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-error">{error}</div>
              ) : filteredSales.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No se encontraron ventas con los filtros aplicados
                </div>
              ) : (
                <div className="rounded-xl border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Orden #</TableHead>
                          <TableHead>Fecha/Hora</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Método Pago</TableHead>
                          <TableHead className="text-center">
                            Productos
                          </TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSales.map((sale) => (
                          <TableRow key={sale.id}>
                            <TableCell className="font-bold">
                              #{sale.saleNumber}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {formatDateTime(sale.date)}
                            </TableCell>
                            <TableCell>
                              {sale.customerName || "Sin cliente"}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(sale.total)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {getPaymentMethodsLabel(sale)}
                            </TableCell>
                            <TableCell className="text-center">
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
                                  title="Ver detalle"
                                >
                                  <IconEye size={18} />
                                </Button>

                                {/* Acciones según estado */}
                                {sale.status === "Pending" && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEdit(sale)}
                                      title="Editar venta"
                                      className="text-blue-600 hover:text-blue-700"
                                    >
                                      <IconPencil size={18} />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDelete(sale)}
                                      title="Borrar orden"
                                      className="text-error hover:text-error"
                                    >
                                      <IconTrash size={18} />
                                    </Button>
                                  </>
                                )}

                                {sale.status === "Completed" && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handlePrint(sale)}
                                      title="Reimprimir factura"
                                    >
                                      <IconPrinter size={18} />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRepeatSale(sale)}
                                      title="Repetir venta"
                                      className="text-green-600 hover:text-green-700"
                                    >
                                      <IconRepeat size={18} />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleClose(sale)}
                                      title="Cerrar contablemente"
                                      className="text-slate-600 hover:text-slate-700"
                                    >
                                      <IconLock size={18} />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRefund(sale)}
                                      title="Reembolsar venta"
                                      className="text-purple-600 hover:text-purple-700"
                                    >
                                      <IconCash size={18} />
                                    </Button>
                                  </>
                                )}

                                {sale.status === "Closed" && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handlePrint(sale)}
                                      title="Reimprimir factura"
                                    >
                                      <IconPrinter size={18} />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRepeatSale(sale)}
                                      title="Repetir venta"
                                      className="text-green-600 hover:text-green-700"
                                    >
                                      <IconRepeat size={18} />
                                    </Button>
                                  </>
                                )}

                                {(sale.status === "Cancelled" ||
                                  sale.status === "Refunded") && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRepeatSale(sale)}
                                    title="Repetir venta"
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <IconRepeat size={18} />
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
        />
      </DashboardLayout>
    </PageTransition>
  );
}
