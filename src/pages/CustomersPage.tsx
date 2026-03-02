import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageTransition } from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomerFormDialog } from "@/components/customers/CustomerFormDialog";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  useCustomerPrefill,
  type CustomerPrefillData,
} from "@/contexts/FormPrefillContext";
import {
  PencilSimple,
  Plus,
  Trash,
  CaretLeft,
  CaretRight,
  AddressBook,
  SpinnerGap,
} from "@phosphor-icons/react";
import type { CustomerDto } from "@/api/customersApi";
import { deleteCustomer, getCustomers } from "@/api/customersApi";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PageHeader, SearchInput } from "@/components/shared";
import { PAGE_LAYOUT_CLASS } from "@/lib/constants";

export function CustomersPage() {
  useDocumentTitle("Clientes");
  const [searchParams, setSearchParams] = useSearchParams();

  // Prefill data from interface agent
  const { hasData: hasPrefillData, getData: getPrefillData } =
    useCustomerPrefill();
  const prefillAppliedRef = useRef(false);
  const [prefillData, setPrefillData] = useState<CustomerPrefillData | null>(
    null
  );

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
        className={PAGE_LAYOUT_CLASS}
      >
        <div className="w-full max-w-[1320px] space-y-4">
          <PageHeader
            icon={AddressBook}
            title="Clientes"
            description="Administra tus clientes y contactos."
            actions={
              <Button onClick={handleCreate} className="gap-2">
                <Plus size={18} weight="bold" />
                Nuevo cliente
              </Button>
            }
          />

          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Nombre, email, teléfono, ciudad, RFC, nota o GPS"
            resultCount={filteredCustomers.length}
            totalCount={customers.length}
            onKeyDown={handleSearchKeyDown}
          />

          <div className="rounded-lg border border-border bg-card">
            <div className="flex flex-col gap-4 p-4">
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <SpinnerGap size={32} weight="bold" className="animate-spin text-primary" />
                  </div>
                ) : error ? (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">
                    {error}
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
                    {customers.length === 0
                      ? "No hay clientes registrados todavía."
                      : "Ningún cliente coincide con la búsqueda."}
                  </div>
                ) : (
                  <div className="rounded-lg border border-border">
                    {/* ── Mobile card list (< md) ─────────────────────────── */}
                    <ul className="divide-y divide-border md:hidden">
                      {paginatedCustomers.map((customer) => (
                        <li
                          key={customer.id}
                          className={cn(
                            "flex items-center justify-between gap-3 px-4 py-3",
                            highlightedCustomerId === customer.id &&
                              "bg-primary/10 ring-1 ring-inset ring-primary/30"
                          )}
                        >
                          {/* Customer info */}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {customer.name}
                            </p>
                            <p className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                              {customer.phone && (
                                <span className="font-mono tabular-nums">
                                  {customer.phone}
                                </span>
                              )}
                              {customer.city && <span>{customer.city}</span>}
                              {!customer.phone && !customer.city && (
                                <span className="italic">Sin datos de contacto</span>
                              )}
                            </p>
                            {customer.email && (
                              <p className="truncate text-xs text-muted-foreground">
                                {customer.email}
                              </p>
                            )}
                          </div>
                          {/* Touch-friendly action buttons */}
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-11 w-11 p-0 active:scale-95"
                              onClick={() => handleEdit(customer)}
                              aria-label={`Editar ${customer.name}`}
                              title={`Editar ${customer.name}`}
                            >
                              <PencilSimple size={18} weight="bold" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-11 w-11 p-0 text-destructive hover:text-destructive/90 active:scale-95"
                              onClick={() => handleDelete(customer)}
                              aria-label={`Eliminar ${customer.name}`}
                              title={`Eliminar ${customer.name}`}
                            >
                              <Trash size={18} weight="bold" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>

                    {/* ── Desktop table (≥ md) ─────────────────────────────── */}
                    <Table className="hidden text-sm md:table">
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Nombre</TableHead>
                          <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Email</TableHead>
                          <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Teléfono</TableHead>
                          <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Ciudad</TableHead>
                          <TableHead className="text-right text-xs uppercase tracking-wide text-muted-foreground">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedCustomers.map((customer) => (
                          <TableRow
                            key={customer.id}
                            className={cn(
                              "text-foreground",
                              highlightedCustomerId === customer.id &&
                                "bg-primary/10 ring-1 ring-primary/30"
                            )}
                          >
                            <TableCell className="font-medium">
                              {customer.name}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {customer.email || "-"}
                            </TableCell>
                            <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                              {customer.phone || "-"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {customer.city || "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleEdit(customer)}
                                  aria-label={`Editar ${customer.name}`}
                                  title={`Editar ${customer.name}`}
                                >
                                  <PencilSimple size={16} weight="bold" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive/90"
                                  onClick={() => handleDelete(customer)}
                                  aria-label={`Eliminar ${customer.name}`}
                                  title={`Eliminar ${customer.name}`}
                                >
                                  <Trash size={16} weight="bold" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* ── Pagination ───────────────────────────────────────── */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          Página{" "}
                          <span className="font-semibold text-foreground">{currentPage}</span>{" "}
                          de{" "}
                          <span className="font-semibold text-foreground">{totalPages}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="h-11 w-11 p-0 md:h-8 md:w-8"
                            aria-label="Página anterior"
                            title="Página anterior"
                          >
                            <CaretLeft size={16} weight="bold" />
                          </Button>
                          <span className="min-w-[60px] text-center text-xs text-muted-foreground">
                            {paginatedCustomers.length} de {filteredCustomers.length}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="h-11 w-11 p-0 md:h-8 md:w-8"
                            aria-label="Próxima página"
                            title="Próxima página"
                          >
                            <CaretRight size={16} weight="bold" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>

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
