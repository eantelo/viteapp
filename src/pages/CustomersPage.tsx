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
  IconPlus,
  IconPencil,
  IconTrash,
  IconSearch,
} from "@tabler/icons-react";
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
        className="flex flex-1 flex-col gap-4 p-4"
      >
        <motion.div
          className="flex items-center justify-between"
          initial={motionInitial}
          animate={motionAnimate}
          transition={motionTransition}
        >
          <div>
            <h1 className="text-3xl font-bold">Clientes</h1>
            <p className="text-slate-500 mt-1">
              Gestiona los clientes registrados en Sales
            </p>
          </div>
          <Button onClick={handleCreate}>
            <IconPlus size={20} className="mr-2" />
            Nuevo Cliente
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
          <Card>
            <CardHeader>
              <CardTitle>Directorio de Clientes</CardTitle>
              <CardDescription>
                Consulta, crea o edita clientes usando los datos reales de
                Sales.Api
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6">
                <div className="relative flex-1">
                  <IconSearch
                    size={20}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <Input
                    placeholder="Buscar por nombre, email, telefono, ciudad, RFC, nota o GPS..."
                    value={search}
                    onChange={handleSearchInput}
                    onKeyDown={handleSearchKeyDown}
                    className="pl-10"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : error ? (
                <div className="text-center py-8 text-error">{error}</div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {customers.length === 0
                    ? "No hay clientes registrados"
                    : "Ningun cliente coincide con la busqueda"}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefono</TableHead>
                        <TableHead>Direccion</TableHead>
                        <TableHead>Ciudad</TableHead>
                        <TableHead>RFC / Tax ID</TableHead>
                        <TableHead>Nota</TableHead>
                        <TableHead>GPS</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer) => (
                        <TableRow
                          key={customer.id}
                          className={cn(
                            highlightedCustomerId === customer.id &&
                              "bg-primary/10 animate-pulse"
                          )}
                        >
                          <TableCell className="font-medium">
                            {customer.name}
                          </TableCell>
                          <TableCell>{customer.email || "-"}</TableCell>
                          <TableCell>{customer.phone || "-"}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {customer.address || "-"}
                          </TableCell>
                          <TableCell>{customer.city || "-"}</TableCell>
                          <TableCell>{customer.taxId || "-"}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {customer.note || "-"}
                          </TableCell>
                          <TableCell>{customer.gps || "-"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                customer.isActive ? "default" : "secondary"
                              }
                            >
                              {customer.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(customer)}
                              >
                                <IconPencil size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-error hover:text-error/90"
                                onClick={() => handleDelete(customer)}
                              >
                                <IconTrash size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
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
