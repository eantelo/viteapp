import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageTransition } from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  createWarehouse,
  deleteWarehouse,
  getWarehouses,
  updateWarehouse,
  type WarehouseCreateDto,
  type WarehouseDto,
  type WarehouseUpdateDto,
} from "@/api/warehousesApi";
import {
  IconBuildingWarehouse,
  IconEdit,
  IconEye,
  IconPlus,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";

interface WarehouseFormState {
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  contactPerson: string;
  isDefault: boolean;
  isActive: boolean;
}

const initialFormState: WarehouseFormState = {
  name: "",
  code: "",
  address: "",
  city: "",
  phone: "",
  contactPerson: "",
  isDefault: false,
  isActive: true,
};

function mapWarehouseToForm(warehouse: WarehouseDto): WarehouseFormState {
  return {
    name: warehouse.name,
    code: warehouse.code ?? "",
    address: warehouse.address ?? "",
    city: warehouse.city ?? "",
    phone: warehouse.phone ?? "",
    contactPerson: warehouse.contactPerson ?? "",
    isDefault: warehouse.isDefault,
    isActive: warehouse.isActive,
  };
}

export function WarehousesPage() {
  useDocumentTitle("Almacenes");

  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseDto | null>(
    null
  );
  const [form, setForm] = useState<WarehouseFormState>(initialFormState);

  const filteredWarehouses = useMemo(() => {
    if (!search.trim()) return warehouses;
    const term = search.trim().toLowerCase();
    return warehouses.filter((warehouse) => {
      return (
        warehouse.name.toLowerCase().includes(term) ||
        (warehouse.code ?? "").toLowerCase().includes(term) ||
        (warehouse.city ?? "").toLowerCase().includes(term) ||
        (warehouse.contactPerson ?? "").toLowerCase().includes(term)
      );
    });
  }, [warehouses, search]);

  useEffect(() => {
    void loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWarehouses();
      setWarehouses(data);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar los almacenes.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingWarehouse(null);
    setForm(initialFormState);
    setDialogOpen(true);
  };

  const openEditDialog = (warehouse: WarehouseDto) => {
    setEditingWarehouse(warehouse);
    setForm(mapWarehouseToForm(warehouse));
    setDialogOpen(true);
  };

  const handleSaveWarehouse = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("El nombre del almacén es obligatorio.");
      return;
    }

    try {
      setSaving(true);

      if (editingWarehouse) {
        const payload: WarehouseUpdateDto = {
          name: form.name.trim(),
          code: form.code.trim() || undefined,
          address: form.address.trim() || undefined,
          city: form.city.trim() || undefined,
          phone: form.phone.trim() || undefined,
          contactPerson: form.contactPerson.trim() || undefined,
          isDefault: form.isDefault,
          isActive: form.isActive,
        };

        await updateWarehouse(editingWarehouse.id, payload);
        toast.success("Almacén actualizado correctamente.");
      } else {
        const payload: WarehouseCreateDto = {
          name: form.name.trim(),
          code: form.code.trim() || undefined,
          address: form.address.trim() || undefined,
          city: form.city.trim() || undefined,
          phone: form.phone.trim() || undefined,
          contactPerson: form.contactPerson.trim() || undefined,
          isDefault: form.isDefault,
        };

        await createWarehouse(payload);
        toast.success("Almacén creado correctamente.");
      }

      setDialogOpen(false);
      setEditingWarehouse(null);
      setForm(initialFormState);
      await loadWarehouses();
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar el almacén.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWarehouse = async (warehouse: WarehouseDto) => {
    const confirmed = window.confirm(
      `¿Eliminar el almacén "${warehouse.name}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    try {
      await deleteWarehouse(warehouse.id);
      toast.success("Almacén eliminado correctamente.");
      await loadWarehouses();
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "No se pudo eliminar el almacén.";
      toast.error(message);
    }
  };

  return (
    <PageTransition>
      <DashboardLayout
        breadcrumbs={[
          { label: "Panel principal", href: "/dashboard" },
          { label: "Almacenes" },
        ]}
        className="flex flex-1 flex-col gap-3 p-3 md:p-4 lg:p-6"
      >
        <div className="w-full max-w-[1320px] space-y-4">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Almacenes
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Gestiona tus ubicaciones de inventario.
              </p>
            </div>

            <Button onClick={openCreateDialog} className="gap-2">
              <IconPlus size={18} />
              Nuevo almacén
            </Button>
          </header>

          <div className="rounded-xl border bg-card p-4">
            <label className="relative block">
              <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center text-slate-400">
                <IconSearch size={18} />
              </span>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre, código, ciudad o contacto"
                className="pl-10"
              />
            </label>
          </div>

          <div className="rounded-xl border bg-card">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary dark:border-slate-700" />
              </div>
            ) : error ? (
              <div className="px-4 py-6 text-sm text-error">{error}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Almacén</TableHead>
                    <TableHead className="hidden md:table-cell">Código</TableHead>
                    <TableHead className="hidden lg:table-cell">Ciudad</TableHead>
                    <TableHead className="hidden lg:table-cell">Contacto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWarehouses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-slate-500">
                        No se encontraron almacenes.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredWarehouses.map((warehouse) => (
                      <TableRow key={warehouse.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <IconBuildingWarehouse size={18} className="text-slate-500" />
                            <div>
                              <p className="font-medium">{warehouse.name}</p>
                              {warehouse.address ? (
                                <p className="text-xs text-slate-500">{warehouse.address}</p>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {warehouse.code ?? "-"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {warehouse.city ?? "-"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {warehouse.contactPerson ?? warehouse.phone ?? "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant={warehouse.isActive ? "default" : "destructive"}>
                              {warehouse.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                            {warehouse.isDefault ? <Badge variant="outline">Predeterminado</Badge> : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/warehouses/${warehouse.id}`)}
                              aria-label={`Ver detalle de ${warehouse.name}`}
                            >
                              <IconEye size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(warehouse)}
                              aria-label={`Editar ${warehouse.name}`}
                            >
                              <IconEdit size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-error hover:text-error"
                              onClick={() => handleDeleteWarehouse(warehouse)}
                              aria-label={`Eliminar ${warehouse.name}`}
                            >
                              <IconTrash size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[560px]">
            <form onSubmit={handleSaveWarehouse}>
              <DialogHeader>
                <DialogTitle>
                  {editingWarehouse ? "Editar almacén" : "Nuevo almacén"}
                </DialogTitle>
                <DialogDescription>
                  Completa los datos básicos del almacén.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="warehouse-name">Nombre</Label>
                  <Input
                    id="warehouse-name"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="warehouse-code">Código</Label>
                    <Input
                      id="warehouse-code"
                      value={form.code}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, code: event.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="warehouse-city">Ciudad</Label>
                    <Input
                      id="warehouse-city"
                      value={form.city}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, city: event.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="warehouse-address">Dirección</Label>
                  <Input
                    id="warehouse-address"
                    value={form.address}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, address: event.target.value }))
                    }
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="warehouse-phone">Teléfono</Label>
                    <Input
                      id="warehouse-phone"
                      value={form.phone}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, phone: event.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="warehouse-contact">Persona contacto</Label>
                    <Input
                      id="warehouse-contact"
                      value={form.contactPerson}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          contactPerson: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.isDefault}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          isDefault: event.target.checked,
                        }))
                      }
                    />
                    Establecer como predeterminado
                  </label>

                  {editingWarehouse ? (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            isActive: event.target.checked,
                          }))
                        }
                      />
                      Almacén activo
                    </label>
                  ) : null}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </PageTransition>
  );
}
