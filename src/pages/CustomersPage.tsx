import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import { CustomerFormDialog } from "@/components/customers/CustomerFormDialog";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  useCustomerPrefill,
  type CustomerPrefillData,
} from "@/contexts/FormPrefillContext";
import { motion, useReducedMotion } from "framer-motion";
import {
  MagnifyingGlass,
  PencilSimple,
  Plus,
  Trash,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import type { CustomerDto } from "@/api/customersApi";
import { deleteCustomer, getCustomers } from "@/api/customersApi";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function CustomersPage() {
  useDocumentTitle("Clientes");
  const [searchParams, setSearchParams] = useSearchParams();
  const prefersReducedMotion = useReducedMotion();

  // Prefill data from interface agent
  const { hasData: hasPrefillData, getData: getPrefillData } =
    useCustomerPrefill();
  const prefillAppliedRef = useRef(false);
  const [prefillData, setPrefillData] = useState<CustomerPrefillData | null>(
    null
  );

  const motionInitial = prefersReducedMotion
    ? { opacity: 1, y: 0 }
    : { opacity: 0, y: 16 };
  const motionAnimate = { opacity: 1, y: 0 };
  const easing: [number, number, number, number] = [0.16, 1, 0.3, 1];
  const motionTransition = {
    duration: prefersReducedMotion ? 0 : 0.45,
    ease: prefersReducedMotion ? undefined : easing,
  };

  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerDto | null>(
    null
  );
  const [highlightedCustomerId, setHighlightedCustomerId] = useState<
    string | null
  >(null);
  const [pendingHighlightId, setPendingHighlightId] = useState<string | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) {
      return customers;
    }

    const term = search.trim().toLowerCase();
    return customers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(term) ||
        (customer.email ?? "").toLowerCase().includes(term) ||
        (customer.phone ?? "").toLowerCase().includes(term) ||
        (customer.taxId ?? "").toLowerCase().includes(term) ||
        (customer.city ?? "").toLowerCase().includes(term) ||
        (customer.note ?? "").toLowerCase().includes(term) ||
        (customer.gps ?? "").toLowerCase().includes(term)
      );
    });
  }, [customers, search]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCustomers.slice(startIndex, endIndex);
  }, [filteredCustomers, currentPage]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCustomers();
      setCustomers(data);
      return data;
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Error al cargar clientes"
      );
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Apply prefill data from interface agent (only once)
  useEffect(() => {
    if (prefillAppliedRef.current) return;

    if (hasPrefillData) {
      const data = getPrefillData();
      if (data) {
        prefillAppliedRef.current = true;
        console.log("[CustomersPage] Applying prefill data:", data);
        setPrefillData(data);
        setEditingCustomer(null);
        setDialogOpen(true);
        toast.info("Datos pre-cargados desde el asistente", {
          description: "Revisa y completa los campos restantes",
        });
      }
    }
  }, [hasPrefillData, getPrefillData]);

  // Manejar el parámetro highlight de la URL
  useEffect(() => {
    const highlightId = searchParams.get("highlight");
    if (highlightId) {
      setPendingHighlightId(highlightId);
      // Limpiar el parámetro de la URL inmediatamente
      setSearchParams({}, { replace: true });
      // Forzar recarga de clientes para asegurar que el nuevo cliente esté disponible
      loadCustomers();
    }
  }, [searchParams, setSearchParams, loadCustomers]);

  // Efecto para abrir el diálogo cuando se encuentra el cliente pendiente
  useEffect(() => {
    if (pendingHighlightId && customers.length > 0 && !loading) {
      const customerToHighlight = customers.find(
        (c) => c.id === pendingHighlightId
      );
      if (customerToHighlight) {
        setHighlightedCustomerId(pendingHighlightId);
        setEditingCustomer(customerToHighlight);
        setDialogOpen(true);
        setPendingHighlightId(null);
        // Quitar el highlight visual después de un tiempo
        const timer = setTimeout(() => {
          setHighlightedCustomerId(null);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [pendingHighlightId, customers, loading]);

  const handleCreate = () => {
    setPrefillData(null);
    setEditingCustomer(null);
    setDialogOpen(true);
  };

  const handleEdit = (customer: CustomerDto) => {
    setPrefillData(null);
    setEditingCustomer(customer);
    setDialogOpen(true);
  };

  const handleDelete = async (customer: CustomerDto) => {
    if (!confirm(`Eliminar al cliente "${customer.name}"?`)) {
      return;
    }

    try {
      await deleteCustomer(customer.id);
      await loadCustomers();
    } catch (deleteError) {
      alert(
        deleteError instanceof Error
          ? deleteError.message
          : "Error al eliminar cliente"
      );
    }
  };

  const handleDialogClose = (saved: boolean) => {
    setDialogOpen(false);
    setEditingCustomer(null);
    setPrefillData(null);
    if (saved) {
      void loadCustomers();
    }
  };

  const handleSearchInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      setSearch((current) => current.trim());
    }
  };

  return (
    <PageTransition>
      <DashboardLayout
        breadcrumbs={[
          { label: "Panel principal", href: "/dashboard" },
          { label: "Clientes" },
        ]}
        className="flex flex-1 flex-col gap-3 p-3 md:p-4 lg:p-6"
      >
        <motion.header
          className="flex flex-row items-center justify-between gap-4 mb-2"
          initial={motionInitial}
          animate={motionAnimate}
          transition={motionTransition}
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-slate-100">
              Clientes
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Administra tus clientes y contactos.
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2 h-fit">
            <Plus size={18} weight="bold" />
            Nuevo cliente
          </Button>
        </motion.header>

        <motion.div
          initial={motionInitial}
          animate={motionAnimate}
          transition={{
            ...motionTransition,
            delay: prefersReducedMotion ? 0 : 0.08,
          }}
        >
          <Card className="border-slate-200/80 dark:border-slate-700/80 dark:bg-slate-900 shadow-none">
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Buscar clientes
                    </span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                        <MagnifyingGlass size={16} weight="bold" />
                      </span>
                      <Input
                        placeholder="Nombre, email, teléfono, ciudad, RFC, nota o GPS"
                        value={search}
                        onChange={handleSearchInput}
                        onKeyDown={handleSearchKeyDown}
                        className="pl-12 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 focus-visible:ring-slate-300 dark:focus-visible:ring-slate-600"
                        aria-label="Buscar clientes"
                      />
                    </div>
                  </label>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {filteredCustomers.length}
                    </span>
                    resultados
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span>{customers.length} clientes totales</span>
                  </div>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-primary" />
                  </div>
                ) : error ? (
                  <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-6 text-center text-sm text-red-600 dark:text-red-400">
                    {error}
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="rounded-md border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    {customers.length === 0
                      ? "No hay clientes registrados todavía."
                      : "Ningún cliente coincide con la búsqueda."}
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700">
                    <Table className="text-sm">
                      <TableHeader className="bg-slate-50 dark:bg-slate-800">
                        <TableRow className="dark:border-slate-700">
                          <TableHead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Nombre</TableHead>
                          <TableHead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Email</TableHead>
                          <TableHead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Teléfono</TableHead>
                          <TableHead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Ciudad</TableHead>
                          <TableHead className="text-right text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedCustomers.map((customer) => (
                          <TableRow
                            key={customer.id}
                            className={cn(
                              "text-slate-700 dark:text-slate-300 dark:border-slate-700",
                              highlightedCustomerId === customer.id &&
                                "bg-primary/10 ring-1 ring-primary/30"
                            )}
                          >
                            <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                              {customer.name}
                            </TableCell>
                            <TableCell className="text-slate-600 dark:text-slate-400">
                              {customer.email || "-"}
                            </TableCell>
                            <TableCell className="font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
                              {customer.phone || "-"}
                            </TableCell>
                            <TableCell className="text-slate-600 dark:text-slate-400">
                              {customer.city || "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 dark:text-slate-400 dark:hover:text-slate-100"
                                  onClick={() => handleEdit(customer)}
                                  aria-label={`Editar ${customer.name}`}
                                >
                                  <PencilSimple size={16} weight="bold" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-error hover:text-error/90"
                                  onClick={() => handleDelete(customer)}
                                  aria-label={`Eliminar ${customer.name}`}
                                >
                                  <Trash size={16} weight="bold" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50">
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          Página <span className="font-semibold text-slate-900 dark:text-slate-100">{currentPage}</span> de{" "}
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{totalPages}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="h-8 w-8 p-0"
                            aria-label="Página anterior"
                          >
                            <CaretLeft size={16} weight="bold" />
                          </Button>
                          <span className="text-xs text-slate-600 dark:text-slate-400 min-w-[60px] text-center">
                            {paginatedCustomers.length} de {filteredCustomers.length}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="h-8 w-8 p-0"
                            aria-label="Próxima página"
                          >
                            <CaretRight size={16} weight="bold" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <CustomerFormDialog
          open={dialogOpen}
          customer={editingCustomer}
          prefillData={prefillData}
          onClose={handleDialogClose}
        />
      </DashboardLayout>
    </PageTransition>
  );
}
