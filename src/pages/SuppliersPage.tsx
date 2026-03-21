import { useEffect, useMemo, useState } from "react";
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
  createSupplier,
  deleteSupplier,
  getSuppliers,
  updateSupplier,
  type SupplierCreateDto,
  type SupplierDto,
  type SupplierUpdateDto,
} from "@/api/suppliersApi";
import { PencilSimple, Plus, Trash, Factory, SpinnerGap } from "@phosphor-icons/react";
import { toast } from "sonner";
import { ConfirmDialog, EmptyState, PageHeader, SearchInput } from "@/components/shared";
import { PAGE_LAYOUT_CLASS } from "@/lib/constants";

interface SupplierFormState {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  taxId: string;
  contactPerson: string;
  note: string;
  isActive: boolean;
}

const initialFormState: SupplierFormState = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  taxId: "",
  contactPerson: "",
  note: "",
  isActive: true,
};

function mapSupplierToForm(supplier: SupplierDto): SupplierFormState {
  return {
    name: supplier.name,
    email: supplier.email ?? "",
    phone: supplier.phone ?? "",
    address: supplier.address ?? "",
    city: supplier.city ?? "",
    taxId: supplier.taxId ?? "",
    contactPerson: supplier.contactPerson ?? "",
    note: supplier.note ?? "",
    isActive: supplier.isActive,
  };
}

export function SuppliersPage() {
  useDocumentTitle("Proveedores");

  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierDto | null>(null);
  const [form, setForm] = useState<SupplierFormState>(initialFormState);
  const [supplierToDelete, setSupplierToDelete] = useState<SupplierDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredSuppliers = useMemo(() => {
    if (!search.trim()) return suppliers;
    const term = search.trim().toLowerCase();
    return suppliers.filter((supplier) =>
      [
        supplier.name,
        supplier.email,
        supplier.phone,
        supplier.city,
        supplier.taxId,
        supplier.contactPerson,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [suppliers, search]);

  const hasActiveSearch = search.trim().length > 0;

  useEffect(() => {
    void loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar los proveedores."
      );
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingSupplier(null);
    setForm(initialFormState);
    setDialogOpen(true);
  };

  const openEditDialog = (supplier: SupplierDto) => {
    setEditingSupplier(supplier);
    setForm(mapSupplierToForm(supplier));
    setDialogOpen(true);
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("El nombre del proveedor es obligatorio.");
      return;
    }

    try {
      setSaving(true);

      if (editingSupplier) {
        const payload: SupplierUpdateDto = {
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          address: form.address.trim() || undefined,
          city: form.city.trim() || undefined,
          taxId: form.taxId.trim() || undefined,
          contactPerson: form.contactPerson.trim() || undefined,
          note: form.note.trim() || undefined,
          isActive: form.isActive,
        };

        await updateSupplier(editingSupplier.id, payload);
        toast.success("Proveedor actualizado correctamente.");
      } else {
        const payload: SupplierCreateDto = {
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          address: form.address.trim() || undefined,
          city: form.city.trim() || undefined,
          taxId: form.taxId.trim() || undefined,
          contactPerson: form.contactPerson.trim() || undefined,
          note: form.note.trim() || undefined,
        };

        await createSupplier(payload);
        toast.success("Proveedor creado correctamente.");
      }

      setDialogOpen(false);
      setEditingSupplier(null);
      setForm(initialFormState);
      await loadSuppliers();
    } catch (saveError) {
      toast.error(
        saveError instanceof Error ? saveError.message : "No se pudo guardar el proveedor."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (supplier: SupplierDto) => {
    setSupplierToDelete(supplier);
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;
    try {
      setDeleteLoading(true);
      await deleteSupplier(supplierToDelete.id);
      toast.success("Proveedor eliminado correctamente.");
      setSupplierToDelete(null);
      await loadSuppliers();
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error
          ? deleteError.message
          : "No se pudo eliminar el proveedor."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <PageTransition>
      <DashboardLayout
        breadcrumbs={[
          { label: "Panel principal", href: "/dashboard" },
          { label: "Proveedores" },
        ]}
        className={PAGE_LAYOUT_CLASS}
      >
        <div className="w-full max-w-[1320px] space-y-4">
          <PageHeader
            icon={Factory}
            title="Proveedores"
            description="Gestiona los proveedores para compras e inventario."
            actions={
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus size={18} weight="bold" />
                Nuevo proveedor
              </Button>
            }
          />

          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, email, teléfono, ciudad o NIT/CI"
            resultCount={filteredSuppliers.length}
            totalCount={suppliers.length}
          />

          <div className="rounded-lg border border-border bg-card">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <SpinnerGap size={32} weight="bold" className="animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">{error}</div>
            ) : (
              filteredSuppliers.length === 0 ? (
                <EmptyState
                  icon={Factory}
                  title={
                    hasActiveSearch
                      ? "No se encontraron proveedores"
                      : "Aún no hay proveedores"
                  }
                  description={
                    hasActiveSearch
                      ? "Prueba con otro nombre, ciudad o dato de contacto, o limpia la búsqueda."
                      : "Crea tu primer proveedor para registrar compras e inventario."
                  }
                  actionLabel={hasActiveSearch ? "Limpiar búsqueda" : "Nuevo proveedor"}
                  onAction={hasActiveSearch ? () => setSearch("") : openCreateDialog}
                  className="m-4 py-12"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proveedor</TableHead>
                      <TableHead className="hidden md:table-cell">Contacto</TableHead>
                      <TableHead className="hidden lg:table-cell">Ciudad</TableHead>
                      <TableHead className="hidden lg:table-cell">NIT/CI</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell>
                          <p className="font-medium">{supplier.name}</p>
                          <p className="text-xs text-muted-foreground">{supplier.email ?? "Sin email"}</p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {supplier.contactPerson ?? supplier.phone ?? "-"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{supplier.city ?? "-"}</TableCell>
                        <TableCell className="hidden lg:table-cell">{supplier.taxId ?? "-"}</TableCell>
                        <TableCell>
                          <Badge variant={supplier.isActive ? "default" : "destructive"}>
                            {supplier.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(supplier)}
                              aria-label={`Editar ${supplier.name}`}
                            >
                              <PencilSimple size={16} weight="bold" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-error hover:text-error"
                              onClick={() => handleDelete(supplier)}
                              aria-label={`Eliminar ${supplier.name}`}
                            >
                              <Trash size={16} weight="bold" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            )}
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[620px]">
            <form onSubmit={handleSave}>
              <DialogHeader>
                <DialogTitle>
                  {editingSupplier ? "Editar proveedor" : "Nuevo proveedor"}
                </DialogTitle>
                <DialogDescription>
                  Completa la información comercial y de contacto.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="supplier-name">Nombre</Label>
                  <Input
                    id="supplier-name"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="supplier-email">Email</Label>
                    <Input
                      id="supplier-email"
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, email: event.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="supplier-phone">Teléfono</Label>
                    <Input
                      id="supplier-phone"
                      value={form.phone}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, phone: event.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="supplier-contact">Persona contacto</Label>
                    <Input
                      id="supplier-contact"
                      value={form.contactPerson}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, contactPerson: event.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="supplier-tax">NIT/CI</Label>
                    <Input
                      id="supplier-tax"
                      value={form.taxId}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, taxId: event.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="supplier-city">Ciudad</Label>
                    <Input
                      id="supplier-city"
                      value={form.city}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, city: event.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="supplier-address">Dirección</Label>
                    <Input
                      id="supplier-address"
                      value={form.address}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, address: event.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="supplier-note">Nota</Label>
                  <Input
                    id="supplier-note"
                    value={form.note}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, note: event.target.value }))
                    }
                  />
                </div>

                {editingSupplier ? (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, isActive: event.target.checked }))
                      }
                    />
                    Proveedor activo
                  </label>
                ) : null}
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

        <ConfirmDialog
          open={Boolean(supplierToDelete)}
          title="Eliminar proveedor"
          description={
            supplierToDelete
              ? `Se eliminará el proveedor "${supplierToDelete.name}". Esta acción no se puede deshacer.`
              : ""
          }
          confirmLabel="Eliminar proveedor"
          cancelLabel="Volver"
          tone="destructive"
          isLoading={deleteLoading}
          onConfirm={() => void confirmDelete()}
          onCancel={() => {
            if (deleteLoading) return;
            setSupplierToDelete(null);
          }}
        />
      </DashboardLayout>
    </PageTransition>
  );
}
