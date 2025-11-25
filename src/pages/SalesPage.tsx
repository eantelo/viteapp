import { useEffect, useState, useMemo } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageTransition } from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconFilter,
  IconEye,
  IconRefresh,
  IconCalendar,
  IconFileInvoice,
} from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SaleDto } from "@/api/salesApi";
import { getSales, deleteSale, downloadInvoicePdf } from "@/api/salesApi";
import { SaleFormDialog } from "@/components/sales/SaleFormDialog";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { motion, useReducedMotion } from "framer-motion";

type SaleStatus = "Completed" | "Closed" | "Cancelled" | "";

interface SalesFilters {
  status: SaleStatus;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
}

export function SalesPage() {
  useDocumentTitle("Órdenes de Venta");
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const motionInitial = prefersReducedMotion
    ? { opacity: 1, y: 0 }
    : { opacity: 0, y: 16 };
  const motionAnimate = { opacity: 1, y: 0 };
  const easing: [number, number, number, number] = [0.16, 1, 0.3, 1];
  const motionTransition = {
    duration: prefersReducedMotion ? 0 : 0.45,
    ease: prefersReducedMotion ? undefined : easing,
  };

  const [sales, setSales] = useState<SaleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<SalesFilters>({
    status: "",
    dateFrom: "",
    dateTo: "",
    minAmount: "",
    maxAmount: "",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<SaleDto | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadSales = async (searchTerm?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSales(searchTerm);
      setSales(data);
      setCurrentPage(1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar órdenes de venta"
      );
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  const filteredSales = useMemo(() => {
    let result = [...sales];

    // Filtro de estado
    if (filters.status) {
      result = result.filter((sale) => sale.status === filters.status);
    }

    // Filtro de rango de fechas
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      result = result.filter((sale) => {
        const saleDate = new Date(sale.date);
        return saleDate >= fromDate;
      });
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter((sale) => {
        const saleDate = new Date(sale.date);
        return saleDate <= toDate;
      });
    }

    // Filtro de monto mínimo
    if (filters.minAmount) {
      const minAmount = parseFloat(filters.minAmount);
      if (!isNaN(minAmount)) {
        result = result.filter((sale) => sale.total >= minAmount);
      }
    }

    // Filtro de monto máximo
    if (filters.maxAmount) {
      const maxAmount = parseFloat(filters.maxAmount);
      if (!isNaN(maxAmount)) {
        result = result.filter((sale) => sale.total <= maxAmount);
      }
    }

    return result;
  }, [sales, filters]);

  // Calcular ventas paginadas
  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredSales.slice(startIndex, endIndex);
  }, [filteredSales, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredSales.length / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  useEffect(() => {
    loadSales();
  }, []);

  const handleSearch = () => {
    loadSales(search);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleCreate = () => {
    setEditingSale(null);
    setDialogOpen(true);
  };

  const handleEdit = (sale: SaleDto) => {
    setEditingSale(sale);
    setDialogOpen(true);
  };

  const handleDelete = async (sale: SaleDto) => {
    if (!confirm(`¿Eliminar la orden de venta "${sale.saleNumber}"?`)) {
      return;
    }

    try {
      await deleteSale(sale.id);
      await loadSales(search);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Error al eliminar orden de venta"
      );
    }
  };

  const handlePrintInvoice = async (sale: SaleDto) => {
    try {
      await downloadInvoicePdf(sale.id);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Error al descargar la factura"
      );
    }
  };

  const handleDialogClose = (saved: boolean) => {
    setDialogOpen(false);
    setEditingSale(null);
    if (saved) {
      loadSales(search);
    }
  };

  const handleRowKeyDown = (
    event: ReactKeyboardEvent<HTMLTableRowElement>,
    sale: SaleDto
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleEdit(sale);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        label: string;
      }
    > = {
      Completed: { variant: "default", label: "Completada" },
      Closed: { variant: "secondary", label: "Cerrada" },
      Cancelled: { variant: "destructive", label: "Cancelada" },
    };

    const config = variants[status] || {
      variant: "outline" as const,
      label: status,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const clearAllFilters = () => {
    setFilters({
      status: "",
      dateFrom: "",
      dateTo: "",
      minAmount: "",
      maxAmount: "",
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = () => {
    return (
      filters.status !== "" ||
      filters.dateFrom !== "" ||
      filters.dateTo !== "" ||
      filters.minAmount !== "" ||
      filters.maxAmount !== ""
    );
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.minAmount) count++;
    if (filters.maxAmount) count++;
    return count;
  };

  return (
    <PageTransition>
      <DashboardLayout
        breadcrumbs={[
          { label: "Panel principal", href: "/dashboard" },
          { label: "Órdenes de Venta" },
        ]}
        className="flex flex-1 flex-col gap-4 p-0"
      >
        <motion.div
          className="flex items-center justify-between px-4 pt-4"
          initial={motionInitial}
          animate={motionAnimate}
          transition={motionTransition}
        >
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
              Órdenes de Venta
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Gestión completa de órdenes de venta
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/sales/history")}
              className="gap-2"
            >
              <IconCalendar size={20} />
              <span>Historial</span>
            </Button>
            <Button onClick={handleCreate} className="gap-2">
              <IconPlus size={20} />
              <span>Nueva Orden</span>
            </Button>
          </div>
        </motion.div>

        {/* Layout con filtros laterales */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 px-4 pb-4"
          initial={motionInitial}
          animate={motionAnimate}
          transition={{
            ...motionTransition,
            delay: prefersReducedMotion ? 0 : 0.08,
          }}
        >
          {/* Panel de filtros */}
          <Card className="bg-white dark:bg-gray-900/50 shadow-sm border-gray-200 dark:border-gray-800 h-fit">
            <CardHeader className="border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconFilter size={20} className="text-primary" />
                  <CardTitle className="text-lg">Filtros</CardTitle>
                </div>
                {hasActiveFilters() && (
                  <Badge variant="secondary" className="text-xs">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Filtro de Estado */}
              <div className="space-y-2">
                <Label
                  htmlFor="status-filter"
                  className="text-sm font-semibold"
                >
                  Estado
                </Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => {
                    setFilters((prev) => ({
                      ...prev,
                      status: value as SaleStatus,
                    }));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger
                    id="status-filter"
                    className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  >
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">Todos</SelectItem>
                    <SelectItem value="Completed">Completada</SelectItem>
                    <SelectItem value="Closed">Cerrada</SelectItem>
                    <SelectItem value="Cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Filtro de Rango de Fechas */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <IconCalendar size={16} />
                  Rango de Fechas
                </Label>
                <div className="space-y-2">
                  <div>
                    <Label
                      htmlFor="date-from"
                      className="text-xs text-gray-500"
                    >
                      Desde
                    </Label>
                    <Input
                      id="date-from"
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => {
                        setFilters((prev) => ({
                          ...prev,
                          dateFrom: e.target.value,
                        }));
                        setCurrentPage(1);
                      }}
                      className="mt-1 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date-to" className="text-xs text-gray-500">
                      Hasta
                    </Label>
                    <Input
                      id="date-to"
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => {
                        setFilters((prev) => ({
                          ...prev,
                          dateTo: e.target.value,
                        }));
                        setCurrentPage(1);
                      }}
                      className="mt-1 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Filtro de Monto */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Rango de Monto</Label>
                <div className="space-y-2">
                  <div>
                    <Label
                      htmlFor="min-amount"
                      className="text-xs text-gray-500"
                    >
                      Mínimo ($)
                    </Label>
                    <Input
                      id="min-amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={filters.minAmount}
                      onChange={(e) => {
                        setFilters((prev) => ({
                          ...prev,
                          minAmount: e.target.value,
                        }));
                        setCurrentPage(1);
                      }}
                      className="mt-1 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="max-amount"
                      className="text-xs text-gray-500"
                    >
                      Máximo ($)
                    </Label>
                    <Input
                      id="max-amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={filters.maxAmount}
                      onChange={(e) => {
                        setFilters((prev) => ({
                          ...prev,
                          maxAmount: e.target.value,
                        }));
                        setCurrentPage(1);
                      }}
                      className="mt-1 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    />
                  </div>
                </div>
              </div>

              {/* Botón Limpiar Filtros */}
              {hasActiveFilters() && (
                <>
                  <Separator />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllFilters}
                    className="w-full gap-2"
                  >
                    <IconRefresh size={16} />
                    Limpiar Filtros
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Contenido principal */}
          <Card className="bg-white dark:bg-gray-900/50 shadow-sm border-gray-200 dark:border-gray-800">
            <CardContent className="pt-6">
              {/* Barra de búsqueda */}
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <IconSearch
                    size={20}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                  />
                  <Input
                    placeholder="Buscar por Orden #, Cliente..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="pl-10 bg-gray-100 dark:bg-gray-800 border-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  variant="secondary"
                  className="gap-2"
                >
                  <IconSearch size={16} />
                  Buscar
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-error">{error}</div>
              ) : filteredSales.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  {hasActiveFilters()
                    ? "No se encontraron órdenes con los filtros aplicados"
                    : "No se encontraron órdenes de venta"}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Tabla */}
                  <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-gray-50 dark:bg-gray-800">
                          <TableRow>
                            <TableHead className="w-4 px-4 py-3">
                              <input
                                type="checkbox"
                                aria-label="Seleccionar todas las órdenes"
                                className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
                              />
                            </TableHead>
                            <TableHead className="px-6 py-3 text-xs font-bold uppercase">
                              Orden #
                            </TableHead>
                            <TableHead className="px-6 py-3 text-xs font-bold uppercase">
                              Cliente
                            </TableHead>
                            <TableHead className="px-6 py-3 text-xs font-bold uppercase">
                              Fecha
                            </TableHead>
                            <TableHead className="px-6 py-3 text-xs font-bold uppercase text-right">
                              Total
                            </TableHead>
                            <TableHead className="px-6 py-3 text-xs font-bold uppercase">
                              Estado
                            </TableHead>
                            <TableHead className="px-6 py-3 text-xs font-bold uppercase text-right">
                              Acciones
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedSales.map((sale) => (
                            <TableRow
                              key={sale.id}
                              className="bg-white dark:bg-gray-900/50 border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
                              onClick={() => handleEdit(sale)}
                              onKeyDown={(event) =>
                                handleRowKeyDown(event, sale)
                              }
                              tabIndex={0}
                              aria-label={`Ver orden ${sale.saleNumber}`}
                            >
                              <TableCell className="w-4 px-4 py-4">
                                <input
                                  type="checkbox"
                                  aria-label={`Seleccionar orden ${sale.saleNumber}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
                                />
                              </TableCell>
                              <TableCell className="px-6 py-4 font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                {sale.saleNumber}
                              </TableCell>
                              <TableCell className="px-6 py-4">
                                {sale.customerName}
                              </TableCell>
                              <TableCell className="px-6 py-4">
                                {formatDate(sale.date)}
                              </TableCell>
                              <TableCell className="px-6 py-4 text-right font-semibold">
                                {formatCurrency(sale.total)}
                              </TableCell>
                              <TableCell className="px-6 py-4">
                                {getStatusBadge(sale.status)}
                              </TableCell>
                              <TableCell className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handlePrintInvoice(sale);
                                    }}
                                    className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
                                    title="Imprimir Factura"
                                  >
                                    <IconFileInvoice size={18} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleEdit(sale);
                                    }}
                                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                  >
                                    <IconEye size={18} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleEdit(sale);
                                    }}
                                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                  >
                                    <IconPencil size={18} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleDelete(sale);
                                    }}
                                    className="text-gray-500 dark:text-gray-400 hover:text-error dark:hover:text-error"
                                  >
                                    <IconTrash size={18} />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Paginación */}
                  <nav className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        Mostrando{" "}
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {(currentPage - 1) * pageSize + 1}-
                          {Math.min(
                            currentPage * pageSize,
                            filteredSales.length
                          )}
                        </span>{" "}
                        de{" "}
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {filteredSales.length}
                        </span>
                      </span>
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor="pageSize"
                          className="text-sm text-gray-500 dark:text-gray-400"
                        >
                          Filas:
                        </label>
                        <select
                          id="pageSize"
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-primary/50"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                      </div>
                    </div>

                    <ul className="inline-flex items-center -space-x-px">
                      <li>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => p - 1)}
                          disabled={!hasPrevPage}
                          className="px-3 h-8 rounded-l-lg border-gray-300 dark:border-gray-700"
                        >
                          <IconChevronLeft size={16} />
                          Anterior
                        </Button>
                      </li>
                      {Array.from(
                        { length: Math.min(totalPages, 5) },
                        (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <li key={pageNum}>
                              <button
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-3 h-8 leading-tight border border-gray-300 dark:border-gray-700 ${
                                  currentPage === pageNum
                                    ? "z-10 text-primary bg-primary/10 border-primary hover:bg-primary/20"
                                    : "text-gray-500 bg-white dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                }`}
                              >
                                {pageNum}
                              </button>
                            </li>
                          );
                        }
                      )}
                      <li>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => p + 1)}
                          disabled={!hasNextPage}
                          className="px-3 h-8 rounded-r-lg border-gray-300 dark:border-gray-700"
                        >
                          Siguiente
                          <IconChevronRight size={16} />
                        </Button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <SaleFormDialog
          open={dialogOpen}
          sale={editingSale}
          onClose={handleDialogClose}
        />
      </DashboardLayout>
    </PageTransition>
  );
}
