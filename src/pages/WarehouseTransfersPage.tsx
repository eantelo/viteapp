import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageTransition } from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { getProducts, type ProductDto } from "@/api/productsApi";
import { getWarehouses, type WarehouseDto } from "@/api/warehousesApi";
import {
  cancelWarehouseTransfer,
  completeWarehouseTransfer,
  createWarehouseTransfer,
  getWarehouseTransfers,
  shipWarehouseTransfer,
  TransferStatus,
  type WarehouseTransferCompleteDto,
  type WarehouseTransferCreateDto,
  type WarehouseTransferDto,
} from "@/api/warehouseTransfersApi";
import {
  Checks,
  Export,
  Plus,
  Truck,
  X,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { ConfirmDialog, EmptyState } from "@/components/shared";
import { PAGE_LAYOUT_CLASS } from "@/lib/constants";

interface TransferItemForm {
  productId: string;
  productLabel: string;
  quantity: string;
}

interface CompleteItemForm {
  transferItemId: string;
  productName: string;
  quantity: number;
  receivedQuantity: string;
}

const initialCreateForm = {
  sourceWarehouseId: "",
  destinationWarehouseId: "",
  notes: "",
  items: [{ productId: "", productLabel: "", quantity: "" }] as TransferItemForm[],
};

export function WarehouseTransfersPage() {
  useDocumentTitle("Traslados entre almacenes");

  const [transfers, setTransfers] = useState<WarehouseTransferDto[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "0" | "1" | "2" | "3">("all");
  const [sourceWarehouseFilter, setSourceWarehouseFilter] = useState("all");
  const [destinationWarehouseFilter, setDestinationWarehouseFilter] = useState("all");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(initialCreateForm);

  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [selectedTransfer, setSelectedTransfer] =
    useState<WarehouseTransferDto | null>(null);
  const [completeNotes, setCompleteNotes] = useState("");
  const [completeItems, setCompleteItems] = useState<CompleteItemForm[]>([]);
  const [transferToCancel, setTransferToCancel] =
    useState<WarehouseTransferDto | null>(null);
  const [canceling, setCanceling] = useState(false);

  const productOptionEntries = useMemo(() => {
    return products
      .filter((product) => product.isActive)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((product) => ({
        id: product.id,
        label: `${product.sku} · ${product.name}`,
      }));
  }, [products]);

  const productOptionLabels = useMemo(
    () => productOptionEntries.map((entry) => entry.label),
    [productOptionEntries]
  );

  const productIdByLabel = useMemo(
    () => new Map(productOptionEntries.map((entry) => [entry.label, entry.id])),
    [productOptionEntries]
  );

  const productLabelById = useMemo(
    () => new Map(productOptionEntries.map((entry) => [entry.id, entry.label])),
    [productOptionEntries]
  );

  const filteredTransfers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return transfers.filter((transfer) => {
      if (
        normalizedSearch &&
        !(
          transfer.transferNumber.toLowerCase().includes(normalizedSearch) ||
          transfer.sourceWarehouseName.toLowerCase().includes(normalizedSearch) ||
          transfer.destinationWarehouseName.toLowerCase().includes(normalizedSearch)
        )
      ) {
        return false;
      }

      if (statusFilter !== "all" && transfer.status !== Number(statusFilter)) {
        return false;
      }

      if (
        sourceWarehouseFilter !== "all" &&
        transfer.sourceWarehouseId !== sourceWarehouseFilter
      ) {
        return false;
      }

      if (
        destinationWarehouseFilter !== "all" &&
        transfer.destinationWarehouseId !== destinationWarehouseFilter
      ) {
        return false;
      }

      return true;
    });
  }, [
    transfers,
    searchTerm,
    statusFilter,
    sourceWarehouseFilter,
    destinationWarehouseFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredTransfers.length / pageSize));
  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    statusFilter !== "all" ||
    sourceWarehouseFilter !== "all" ||
    destinationWarehouseFilter !== "all";

  const paginatedTransfers = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredTransfers.slice(start, start + pageSize);
  }, [filteredTransfers, pageIndex, pageSize]);

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    setPageIndex(0);
  }, [searchTerm, statusFilter, sourceWarehouseFilter, destinationWarehouseFilter, pageSize]);

  const pendingCount = useMemo(
    () => transfers.filter((transfer) => transfer.status === TransferStatus.Pending).length,
    [transfers]
  );

  const inTransitCount = useMemo(
    () => transfers.filter((transfer) => transfer.status === TransferStatus.InTransit).length,
    [transfers]
  );

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [transfersResponse, warehousesResponse, productsResponse] = await Promise.all([
        getWarehouseTransfers(),
        getWarehouses(),
        getProducts(),
      ]);
      setTransfers(transfersResponse);
      setWarehouses(warehousesResponse);
      setProducts(productsResponse);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar los traslados.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: number) => {
    if (status === TransferStatus.Completed) {
      return <Badge variant="default">Completado</Badge>;
    }

    if (status === TransferStatus.Cancelled) {
      return <Badge variant="destructive">Cancelado</Badge>;
    }

    if (status === TransferStatus.InTransit) {
      return <Badge variant="secondary">En tránsito</Badge>;
    }

    return <Badge variant="outline">Pendiente</Badge>;
  };

  const resetCreateForm = () => {
    setCreateForm(initialCreateForm);
  };

  const updateCreateItem = (
    index: number,
    field: keyof TransferItemForm,
    value: string
  ) => {
    setCreateForm((current) => {
      const nextItems = [...current.items];
      nextItems[index] = { ...nextItems[index], [field]: value };
      return { ...current, items: nextItems };
    });
  };

  const addCreateItemRow = () => {
    setCreateForm((current) => ({
      ...current,
      items: [...current.items, { productId: "", productLabel: "", quantity: "" }],
    }));
  };

  const removeCreateItemRow = (index: number) => {
    setCreateForm((current) => {
      if (current.items.length === 1) {
        return current;
      }

      return {
        ...current,
        items: current.items.filter((_, currentIndex) => currentIndex !== index),
      };
    });
  };

  const handleSelectProductLabel = (index: number, label: string) => {
    const selectedId = productIdByLabel.get(label) ?? "";
    setCreateForm((current) => {
      const nextItems = [...current.items];
      nextItems[index] = {
        ...nextItems[index],
        productLabel: label,
        productId: selectedId,
      };
      return { ...current, items: nextItems };
    });
  };

  const handleCreateTransfer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!createForm.sourceWarehouseId || !createForm.destinationWarehouseId) {
      toast.error("Selecciona almacén origen y destino.");
      return;
    }

    if (createForm.sourceWarehouseId === createForm.destinationWarehouseId) {
      toast.error("El almacén origen y destino deben ser distintos.");
      return;
    }

    const hasInvalidProductSelection = createForm.items.some(
      (item) => item.productLabel.trim().length > 0 && !item.productId
    );

    if (hasInvalidProductSelection) {
      toast.error("Selecciona un producto válido desde la lista (SKU · Nombre).");
      return;
    }

    const parsedItems = createForm.items
      .map((item) => ({
        productId: item.productId.trim(),
        quantity: Number(item.quantity),
      }))
      .filter((item) => Boolean(item.productId) && Number.isFinite(item.quantity));

    if (parsedItems.length === 0) {
      toast.error("Agrega al menos un producto válido.");
      return;
    }

    if (parsedItems.some((item) => item.quantity <= 0)) {
      toast.error("Todas las cantidades deben ser mayores a cero.");
      return;
    }

    const payload: WarehouseTransferCreateDto = {
      sourceWarehouseId: createForm.sourceWarehouseId,
      destinationWarehouseId: createForm.destinationWarehouseId,
      notes: createForm.notes.trim() || undefined,
      items: parsedItems,
    };

    try {
      setCreating(true);
      await createWarehouseTransfer(payload);
      toast.success("Traslado creado correctamente.");
      setCreateDialogOpen(false);
      resetCreateForm();
      await loadData();
    } catch (createError) {
      const message =
        createError instanceof Error
          ? createError.message
          : "No se pudo crear el traslado.";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const handleShipTransfer = async (transferId: string) => {
    try {
      await shipWarehouseTransfer(transferId);
      toast.success("Traslado enviado a tránsito.");
      await loadData();
    } catch (shipError) {
      const message =
        shipError instanceof Error
          ? shipError.message
          : "No se pudo enviar el traslado.";
      toast.error(message);
    }
  };

  const openCompleteDialog = (transfer: WarehouseTransferDto) => {
    setSelectedTransfer(transfer);
    setCompleteNotes("");
    setCompleteItems(
      transfer.items.map((item) => ({
        transferItemId: item.id,
        productName: item.productName,
        quantity: item.quantity,
        receivedQuantity: String(item.quantity),
      }))
    );
    setCompleteDialogOpen(true);
  };

  const updateCompleteItemQuantity = (transferItemId: string, value: string) => {
    setCompleteItems((current) =>
      current.map((item) =>
        item.transferItemId === transferItemId
          ? { ...item, receivedQuantity: value }
          : item
      )
    );
  };

  const handleCompleteTransfer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedTransfer) return;

    const parsedItems = completeItems.map((item) => {
      const parsedQty = Number(item.receivedQuantity);
      return {
        transferItemId: item.transferItemId,
        quantityRequested: item.quantity,
        receivedQuantity: Number.isFinite(parsedQty) ? parsedQty : NaN,
      };
    });

    if (parsedItems.some((item) => Number.isNaN(item.receivedQuantity))) {
      toast.error("Todas las cantidades recibidas deben ser numéricas.");
      return;
    }

    if (parsedItems.some((item) => item.receivedQuantity < 0)) {
      toast.error("La cantidad recibida no puede ser negativa.");
      return;
    }

    if (parsedItems.some((item) => item.receivedQuantity > item.quantityRequested)) {
      toast.error("La cantidad recibida no puede superar la solicitada.");
      return;
    }

    const payload: WarehouseTransferCompleteDto = {
      notes: completeNotes.trim() || undefined,
      items: parsedItems.map((item) => ({
        transferItemId: item.transferItemId,
        receivedQuantity: item.receivedQuantity,
      })),
    };

    try {
      setCompleting(true);
      await completeWarehouseTransfer(selectedTransfer.id, payload);
      toast.success("Traslado completado correctamente.");
      setCompleteDialogOpen(false);
      setSelectedTransfer(null);
      setCompleteItems([]);
      setCompleteNotes("");
      await loadData();
    } catch (completeError) {
      const message =
        completeError instanceof Error
          ? completeError.message
          : "No se pudo completar el traslado.";
      toast.error(message);
    } finally {
      setCompleting(false);
    }
  };

  const handleCancelTransfer = (transfer: WarehouseTransferDto) => {
    setTransferToCancel(transfer);
  };

  const confirmCancelTransfer = async () => {
    if (!transferToCancel) return;
    try {
      setCanceling(true);
      await cancelWarehouseTransfer(transferToCancel.id);
      toast.success("Traslado cancelado.");
      setTransferToCancel(null);
      await loadData();
    } catch (cancelError) {
      const message =
        cancelError instanceof Error
          ? cancelError.message
          : "No se pudo cancelar el traslado.";
      toast.error(message);
    } finally {
      setCanceling(false);
    }
  };

  return (
    <PageTransition>
      <DashboardLayout
        breadcrumbs={[
          { label: "Panel principal", href: "/dashboard" },
          { label: "Traslados" },
        ]}
        className={PAGE_LAYOUT_CLASS}
      >
        <div className="w-full max-w-[1320px] space-y-4">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Traslados de inventario
              </h1>
              <p className="text-sm text-muted-foreground">
                Mueve stock entre almacenes y gestiona su estado.
              </p>
            </div>
            <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
              <Plus size={18} weight="bold" />
              Nuevo traslado
            </Button>
          </header>

          <div className="rounded-xl border bg-card p-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
              <div className="grid gap-1">
                <Label htmlFor="transfer-search">Buscar</Label>
                <Input
                  id="transfer-search"
                  placeholder="Folio, origen o destino"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <div className="grid gap-1">
                <Label>Estado</Label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "0" | "1" | "2" | "3") }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="0">Pendiente</SelectItem>
                    <SelectItem value="1">En tránsito</SelectItem>
                    <SelectItem value="2">Completado</SelectItem>
                    <SelectItem value="3">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label>Origen</Label>
                <Select value={sourceWarehouseFilter} onValueChange={setSourceWarehouseFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={`source-filter-${warehouse.id}`} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label>Destino</Label>
                <Select value={destinationWarehouseFilter} onValueChange={setDestinationWarehouseFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={`destination-filter-${warehouse.id}`} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-sm text-muted-foreground">Pendientes</p>
              <p className="text-3xl font-semibold">{pendingCount}</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-sm text-muted-foreground">En tránsito</p>
              <p className="text-3xl font-semibold">{inTransitCount}</p>
            </div>
          </div>

          <div className="rounded-xl border bg-card">
            {loading ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Cargando traslados...
              </div>
            ) : error ? (
              <div className="px-4 py-6 text-sm text-error">{error}</div>
            ) : (
              filteredTransfers.length === 0 ? (
                <EmptyState
                  icon={Truck}
                  title={
                    hasActiveFilters
                      ? "No hay traslados para los filtros seleccionados"
                      : "Aún no hay traslados entre almacenes"
                  }
                  description={
                    hasActiveFilters
                      ? "Ajusta origen, destino o estado, o limpia los filtros para ver más resultados."
                      : "Crea tu primer traslado para mover stock entre almacenes."
                  }
                  actionLabel={hasActiveFilters ? "Limpiar filtros" : "Nuevo traslado"}
                  onAction={
                    hasActiveFilters
                      ? () => {
                          setSearchTerm("");
                          setStatusFilter("all");
                          setSourceWarehouseFilter("all");
                          setDestinationWarehouseFilter("all");
                        }
                      : () => setCreateDialogOpen(true)
                  }
                  className="m-4 py-12"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Folio</TableHead>
                      <TableHead>Origen / Destino</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="hidden md:table-cell">Items</TableHead>
                      <TableHead className="hidden lg:table-cell">Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTransfers.map((transfer) => (
                      <TableRow key={transfer.id}>
                        <TableCell className="font-medium">
                          {transfer.transferNumber}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{transfer.sourceWarehouseName}</p>
                            <p className="text-muted-foreground">→ {transfer.destinationWarehouseName}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {transfer.items.length}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {new Date(transfer.createdAt).toLocaleString("es-MX")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            {transfer.status === TransferStatus.Pending ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1"
                                  onClick={() => handleShipTransfer(transfer.id)}
                                >
                                  <Truck size={14} weight="bold" />
                                  Enviar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="gap-1 text-error hover:text-error"
                                  onClick={() => handleCancelTransfer(transfer)}
                                >
                                  <X size={14} weight="bold" />
                                  Cancelar
                                </Button>
                              </>
                            ) : null}

                            {transfer.status === TransferStatus.InTransit ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1"
                                  onClick={() => openCompleteDialog(transfer)}
                                >
                                  <Checks size={14} weight="bold" />
                                  Completar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="gap-1 text-error hover:text-error"
                                  onClick={() => handleCancelTransfer(transfer)}
                                >
                                  <X size={14} weight="bold" />
                                  Cancelar
                                </Button>
                              </>
                            ) : null}

                            {transfer.status === TransferStatus.Completed ||
                            transfer.status === TransferStatus.Cancelled ? (
                              <span className="text-xs text-muted-foreground">Sin acciones</span>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredTransfers.length === 0 ? 0 : pageIndex * pageSize + 1} - {Math.min((pageIndex + 1) * pageSize, filteredTransfers.length)} de {filteredTransfers.length} traslados
            </p>
            <div className="flex items-center gap-2">
              <Select value={`${pageSize}`} onValueChange={(value) => setPageSize(Number(value))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / página</SelectItem>
                  <SelectItem value="20">20 / página</SelectItem>
                  <SelectItem value="50">50 / página</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
                disabled={pageIndex === 0}
              >
                Anterior
              </Button>
              <span className="min-w-[90px] text-center text-sm text-muted-foreground">
                Página {Math.min(pageIndex + 1, totalPages)} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex((prev) => Math.min(totalPages - 1, prev + 1))}
                disabled={pageIndex >= totalPages - 1}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>

        <Dialog
          open={createDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) resetCreateForm();
          }}
        >
          <DialogContent className="sm:max-w-[780px]">
            <form onSubmit={handleCreateTransfer}>
              <DialogHeader>
                <DialogTitle>Nuevo traslado</DialogTitle>
                <DialogDescription>
                  Define origen, destino y productos a transferir.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Almacén origen</Label>
                    <Select
                      value={createForm.sourceWarehouseId}
                      onValueChange={(value) =>
                        setCreateForm((current) => ({
                          ...current,
                          sourceWarehouseId: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona origen" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Almacén destino</Label>
                    <Select
                      value={createForm.destinationWarehouseId}
                      onValueChange={(value) =>
                        setCreateForm((current) => ({
                          ...current,
                          destinationWarehouseId: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="transfer-notes">Notas</Label>
                  <Textarea
                    id="transfer-notes"
                    value={createForm.notes}
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="Notas opcionales del traslado"
                    rows={3}
                  />
                </div>

                <div className="space-y-3 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Items</p>
                    <Button type="button" variant="outline" size="sm" onClick={addCreateItemRow}>
                      Agregar fila
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {createForm.items.map((item, index) => (
                      <div key={`transfer-item-${index}`} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_160px_auto]">
                        <Combobox
                          value={item.productLabel}
                          onValueChange={(value) => handleSelectProductLabel(index, value)}
                          options={productOptionLabels}
                          placeholder="Buscar por SKU o nombre"
                          emptyText="Sin coincidencias de producto"
                        />
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(event) =>
                            updateCreateItem(index, "quantity", event.target.value)
                          }
                          placeholder="Cantidad"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-error hover:text-error"
                          onClick={() => removeCreateItemRow(index)}
                          disabled={createForm.items.length === 1}
                        >
                          Quitar
                        </Button>
                        {item.productId ? (
                          <p className="md:col-span-3 text-xs text-slate-500">
                            Seleccionado: {productLabelById.get(item.productId) ?? item.productId}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={creating}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={creating} className="gap-2">
                  <Export size={16} weight="bold" />
                  {creating ? "Creando..." : "Crear traslado"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog
          open={completeDialogOpen}
          onOpenChange={(open) => {
            setCompleteDialogOpen(open);
            if (!open) {
              setSelectedTransfer(null);
              setCompleteItems([]);
              setCompleteNotes("");
            }
          }}
        >
          <DialogContent className="sm:max-w-[740px]">
            <form onSubmit={handleCompleteTransfer}>
              <DialogHeader>
                <DialogTitle>
                  Completar traslado {selectedTransfer?.transferNumber ?? ""}
                </DialogTitle>
                <DialogDescription>
                  Confirma cantidades recibidas por cada item.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-2 rounded-lg border p-3">
                  {completeItems.map((item) => (
                    <div
                      key={item.transferItemId}
                      className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_120px_140px] md:items-center"
                    >
                      <div>
                        <p className="text-sm font-medium">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          Solicitado: {item.quantity}
                        </p>
                      </div>
                      <Label
                        htmlFor={`received-${item.transferItemId}`}
                        className="text-xs text-muted-foreground"
                      >
                        Recibido
                      </Label>
                      <Input
                        id={`received-${item.transferItemId}`}
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={item.receivedQuantity}
                        onChange={(event) =>
                          updateCompleteItemQuantity(
                            item.transferItemId,
                            event.target.value
                          )
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="complete-notes">Notas de recepción</Label>
                  <Textarea
                    id="complete-notes"
                    value={completeNotes}
                    onChange={(event) => setCompleteNotes(event.target.value)}
                    rows={3}
                    placeholder="Diferencias, observaciones, daños, etc."
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCompleteDialogOpen(false)}
                  disabled={completing}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={completing}>
                  {completing ? "Completando..." : "Completar traslado"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={Boolean(transferToCancel)}
          title="Cancelar traslado"
          description={
            transferToCancel
              ? `Se cancelará el traslado ${transferToCancel.transferNumber} entre ${transferToCancel.sourceWarehouseName} y ${transferToCancel.destinationWarehouseName}.`
              : ""
          }
          confirmLabel="Cancelar traslado"
          cancelLabel="Volver"
          tone="destructive"
          isLoading={canceling}
          onConfirm={() => void confirmCancelTransfer()}
          onCancel={() => {
            if (canceling) return;
            setTransferToCancel(null);
          }}
        />
      </DashboardLayout>
    </PageTransition>
  );
}
