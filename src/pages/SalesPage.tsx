import { useEffect, useState, useMemo } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
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
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconFilter,
  IconX,
  IconEye,
} from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SaleDto } from "@/api/salesApi";
import { getSales, deleteSale } from "@/api/salesApi";
import { SaleFormDialog } from "@/components/sales/SaleFormDialog";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { motion, useReducedMotion } from "framer-motion";

type SaleStatus = "Pending" | "Invoiced" | "Shipped" | "Cancelled" | "";

export function SalesPage() {
  useDocumentTitle("Órdenes de Venta");
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
  const [statusFilter, setStatusFilter] = useState<SaleStatus>("");
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

    if (statusFilter) {
      result = result.filter((sale) => sale.status === statusFilter);
    }

    return result;
  }, [sales, statusFilter]);

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
      Pending: { variant: "outline", label: "Pendiente" },
      Invoiced: { variant: "secondary", label: "Facturada" },
      Shipped: { variant: "default", label: "Enviada" },
      Cancelled: { variant: "destructive", label: "Cancelada" },
    };

    const config = variants[status] || {
      variant: "outline" as const,
      label: status,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const clearStatusFilter = () => {
    setStatusFilter("");
    setCurrentPage(1);
  };

  return (
    <PageTransition>
      <DashboardLayout
        breadcrumbs={[
          { label: "Panel principal", href: "/dashboard" },
          { label: "Órdenes de Venta" },
        ]}
        className="flex flex-1 flex-col gap-4 p-4"
      >
        <motion.div
          className="flex items-center justify-between"
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
          <Button onClick={handleCreate} className="gap-2">
            <IconPlus size={20} />
            <span>Nueva Orden</span>
          </Button>
        </motion.div>

        <motion.div
          initial={motionInitial}
          animate={motionAnimate}
          transition={{
            ...motionTransition,
            delay: prefersReducedMotion ? 0 : 0.08,
          }}
        >
          <Card className="bg-white dark:bg-gray-900/50 shadow-sm border-gray-200 dark:border-gray-800">
            <CardHeader className="border-b border-gray-200 dark:border-gray-800">
              <CardTitle>Listado de Órdenes</CardTitle>
              <CardDescription>
                Todas las órdenes de venta registradas en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Barra de búsqueda y filtros */}
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
                <div className="flex items-center gap-2">
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value as SaleStatus);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[180px] bg-gray-100 dark:bg-gray-800 border-none">
                      <div className="flex items-center gap-2">
                        <IconFilter size={16} />
                        <SelectValue placeholder="Estado" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">Todos</SelectItem>
                      <SelectItem value="Pending">Pendiente</SelectItem>
                      <SelectItem value="Invoiced">Facturada</SelectItem>
                      <SelectItem value="Shipped">Enviada</SelectItem>
                      <SelectItem value="Cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleSearch} variant="secondary">
                    Buscar
                  </Button>
                </div>
              </div>

              {/* Filtros activos */}
              {statusFilter && (
                <div className="flex gap-2 mb-4 flex-wrap">
                  <button
                    onClick={clearStatusFilter}
                    className="flex h-7 shrink-0 items-center justify-center gap-x-1.5 rounded-full bg-primary/10 px-2.5 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                  >
                    <span>Estado: {statusFilter}</span>
                    <IconX size={14} />
                  </button>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-error">{error}</div>
              ) : filteredSales.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  {statusFilter
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
                                {formatDate(sale.saleDate)}
                              </TableCell>
                              <TableCell className="px-6 py-4 text-right font-semibold">
                                {formatCurrency(sale.totalAmount)}
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
