import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageTransition } from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
  cancelPurchase,
  confirmPurchase,
  createPurchase,
  getPurchaseSummary,
  getPurchases,
  markPurchaseAsPaid,
  PurchaseOrderStatus,
  PurchasePaymentStatus,
  receivePurchase,
  type PurchaseOrderCreateDto,
  type PurchaseOrderDto,
  type PurchaseOrderStatusType,
} from "@/api/purchasesApi";
import { getSuppliers, type SupplierDto } from "@/api/suppliersApi";
import { getProducts, type ProductDto } from "@/api/productsApi";
import {
  Checks,
  Plus,
  ShoppingCart,
  Truck,
  X,
  SpinnerGap,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { ConfirmDialog, PageHeader, SearchInput } from "@/components/shared";
import { PAGE_LAYOUT_CLASS } from "@/lib/constants";

interface PurchaseItemForm {
  productId: string;
  quantity: string;
  unitCost: string;
}

interface ReceiveItemForm {
  purchaseOrderItemId: string;
  productName: string;
  maxReceivable: number;
  quantityReceived: string;
}

const initialCreateState = {
  supplierId: "",
  date: new Date().toISOString().slice(0, 10),
  expectedDeliveryDate: "",
  taxAmount: "0",
  notes: "",
  items: [{ productId: "", quantity: "", unitCost: "" }] as PurchaseItemForm[],
};

const statusLabelMap: Record<number, string> = {
  [PurchaseOrderStatus.Draft]: "Borrador",
  [PurchaseOrderStatus.Pending]: "Pendiente",
  [PurchaseOrderStatus.PartiallyReceived]: "Recepción parcial",
  [PurchaseOrderStatus.Received]: "Recibida",
  [PurchaseOrderStatus.Cancelled]: "Cancelada",
};

function statusBadgeVariant(status: PurchaseOrderStatusType): "default" | "secondary" | "destructive" | "outline" {
  if (status === PurchaseOrderStatus.Received) return "default";
  if (status === PurchaseOrderStatus.Cancelled) return "destructive";
  if (status === PurchaseOrderStatus.PartiallyReceived) return "secondary";
  return "outline";
}

export function PurchasesPage() {
  useDocumentTitle("Compras");

  const [orders, setOrders] = useState<PurchaseOrderDto[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<{
    totalOrders: number;
    pendingOrders: number;
    receivedOrders: number;
    pendingAmount: number;
    totalAmount: number;
  } | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createForm, setCreateForm] = useState(initialCreateState);

  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [receiveNotes, setReceiveNotes] = useState("");
  const [receiveItems, setReceiveItems] = useState<ReceiveItemForm[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderDto | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<PurchaseOrderDto | null>(null);
  const [canceling, setCanceling] = useState(false);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      const statusMatch =
        statusFilter === "all" ? true : String(order.status) === statusFilter;

      if (!statusMatch) return false;

      if (!term) return true;

      return (
        String(order.purchaseOrderNumber).includes(term) ||
        order.supplierName.toLowerCase().includes(term)
      );
    });
  }, [orders, search, statusFilter]);

  const createTotal = useMemo(() => {
    const subtotal = createForm.items
      .map((item) => Number(item.quantity) * Number(item.unitCost))
      .filter((value) => Number.isFinite(value))
      .reduce((acc, value) => acc + value, 0);

    const tax = Number(createForm.taxAmount);
    return subtotal + (Number.isFinite(tax) ? tax : 0);
  }, [createForm]);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [ordersData, suppliersData, productsData, summaryData] = await Promise.all([
        getPurchases(),
        getSuppliers(),
        getProducts(),
        getPurchaseSummary(),
      ]);

      setOrders(ordersData);
      setSuppliers(suppliersData);
      setProducts(productsData.filter((product) => product.isActive));
      setSummary(summaryData);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar las compras."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetCreateForm = () => {
    setCreateForm(initialCreateState);
  };

  const addItemRow = () => {
    setCreateForm((current) => ({
      ...current,
      items: [...current.items, { productId: "", quantity: "", unitCost: "" }],
    }));
  };

  const removeItemRow = (index: number) => {
    setCreateForm((current) => {
      if (current.items.length === 1) return current;
      return {
        ...current,
        items: current.items.filter((_, i) => i !== index),
      };
    });
  };

  const updateItemRow = (
    index: number,
    field: keyof PurchaseItemForm,
    value: string
  ) => {
    setCreateForm((current) => {
      const items = [...current.items];
      items[index] = { ...items[index], [field]: value };
      return { ...current, items };
    });
  };

  const handleCreatePurchase = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!createForm.supplierId) {
      toast.error("Selecciona un proveedor.");
      return;
    }

    const items = createForm.items
      .map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
      }))
      .filter((item) => item.productId && Number.isFinite(item.quantity) && Number.isFinite(item.unitCost));

    if (items.length === 0) {
      toast.error("Agrega al menos un item válido.");
      return;
    }

    if (items.some((item) => item.quantity <= 0 || item.unitCost <= 0)) {
      toast.error("La cantidad y costo unitario deben ser mayores a cero.");
      return;
    }

    const payload: PurchaseOrderCreateDto = {
      supplierId: createForm.supplierId,
      date: new Date(createForm.date).toISOString(),
      expectedDeliveryDate: createForm.expectedDeliveryDate
        ? new Date(createForm.expectedDeliveryDate).toISOString()
        : undefined,
      taxAmount: Number(createForm.taxAmount) || 0,
      notes: createForm.notes.trim() || undefined,
      items,
    };

    try {
      setSaving(true);
      await createPurchase(payload);
      toast.success("Orden de compra creada correctamente.");
      setCreateDialogOpen(false);
      resetCreateForm();
      await loadData();
    } catch (saveError) {
      toast.error(
        saveError instanceof Error ? saveError.message : "No se pudo crear la orden de compra."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async (order: PurchaseOrderDto) => {
    try {
      await confirmPurchase(order.id);
      toast.success(`OC #${order.purchaseOrderNumber} confirmada.`);
      await loadData();
    } catch (confirmError) {
      toast.error(
        confirmError instanceof Error ? confirmError.message : "No se pudo confirmar la orden."
      );
    }
  };

  const handleCancel = (order: PurchaseOrderDto) => {
    setOrderToCancel(order);
  };

  const confirmCancel = async () => {
    if (!orderToCancel) return;
    try {
      setCanceling(true);
      await cancelPurchase(orderToCancel.id);
      toast.success(`OC #${orderToCancel.purchaseOrderNumber} cancelada.`);
      setOrderToCancel(null);
      await loadData();
    } catch (cancelError) {
      toast.error(
        cancelError instanceof Error ? cancelError.message : "No se pudo cancelar la orden."
      );
    } finally {
      setCanceling(false);
    }
  };

  const handleMarkAsPaid = async (order: PurchaseOrderDto) => {
    try {
      await markPurchaseAsPaid(order.id);
      toast.success(`OC #${order.purchaseOrderNumber} marcada como pagada.`);
      await loadData();
    } catch (errorMark) {
      toast.error(errorMark instanceof Error ? errorMark.message : "No se pudo marcar como pagada.");
    }
  };

  const openReceiveDialog = (order: PurchaseOrderDto) => {
    const items = order.items
      .map((item) => ({
        purchaseOrderItemId: item.id,
        productName: item.productName,
        maxReceivable: Math.max(item.quantity - item.receivedQuantity, 0),
        quantityReceived: String(Math.max(item.quantity - item.receivedQuantity, 0)),
      }))
      .filter((item) => item.maxReceivable > 0);

    if (items.length === 0) {
      toast.info("Esta orden ya no tiene cantidades pendientes por recibir.");
      return;
    }

    setSelectedOrder(order);
    setReceiveItems(items);
    setReceiveNotes("");
    setReceiveDialogOpen(true);
  };

  const updateReceiveItem = (purchaseOrderItemId: string, value: string) => {
    setReceiveItems((current) =>
      current.map((item) =>
        item.purchaseOrderItemId === purchaseOrderItemId
          ? { ...item, quantityReceived: value }
          : item
      )
    );
  };

  const handleReceive = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedOrder) return;

    const items = receiveItems.map((item) => ({
      purchaseOrderItemId: item.purchaseOrderItemId,
      quantityReceived: Number(item.quantityReceived),
      maxReceivable: item.maxReceivable,
    }));

    if (items.some((item) => Number.isNaN(item.quantityReceived))) {
      toast.error("Las cantidades recibidas deben ser numéricas.");
      return;
    }

    if (items.some((item) => item.quantityReceived < 0)) {
      toast.error("Las cantidades recibidas no pueden ser negativas.");
      return;
    }

    if (items.some((item) => item.quantityReceived > item.maxReceivable)) {
      toast.error("Una o más cantidades recibidas superan la cantidad pendiente.");
      return;
    }

    const hasAnyReceipt = items.some((item) => item.quantityReceived > 0);
    if (!hasAnyReceipt) {
      toast.error("Debes registrar al menos una cantidad recibida mayor a cero.");
      return;
    }

    try {
      setReceiving(true);
      await receivePurchase(selectedOrder.id, {
        notes: receiveNotes.trim() || undefined,
        items: items.map((item) => ({
          purchaseOrderItemId: item.purchaseOrderItemId,
          quantityReceived: item.quantityReceived,
        })),
      });
      toast.success(`Recepción registrada para OC #${selectedOrder.purchaseOrderNumber}.`);
      setReceiveDialogOpen(false);
      setSelectedOrder(null);
      setReceiveItems([]);
      setReceiveNotes("");
      await loadData();
    } catch (receiveError) {
      toast.error(
        receiveError instanceof Error ? receiveError.message : "No se pudo registrar la recepción."
      );
    } finally {
      setReceiving(false);
    }
  };

  return (
    <PageTransition>
      <DashboardLayout
        breadcrumbs={[
          { label: "Panel principal", href: "/dashboard" },
          { label: "Compras" },
        ]}
        className={PAGE_LAYOUT_CLASS}
      >
        <div className="w-full max-w-[1320px] space-y-4">
          <PageHeader
            icon={ShoppingCart}
            title="Compras"
            description="Controla órdenes de compra y recepciones de inventario."
            actions={
              <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
                <Plus size={18} weight="bold" />
                Nueva compra
              </Button>
            }
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Órdenes totales</p>
              <p className="text-3xl font-semibold">{summary?.totalOrders ?? 0}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Pendientes</p>
              <p className="text-3xl font-semibold">{summary?.pendingOrders ?? 0}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Recibidas</p>
              <p className="text-3xl font-semibold">{summary?.receivedOrders ?? 0}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Monto pendiente</p>
              <p className="text-3xl font-semibold">
                ${(summary?.pendingAmount ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="lg:w-[420px]">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Buscar por folio o proveedor"
                />
              </div>

              <div className="w-full lg:w-[260px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value={String(PurchaseOrderStatus.Draft)}>Borrador</SelectItem>
                    <SelectItem value={String(PurchaseOrderStatus.Pending)}>Pendiente</SelectItem>
                    <SelectItem value={String(PurchaseOrderStatus.PartiallyReceived)}>Recepción parcial</SelectItem>
                    <SelectItem value={String(PurchaseOrderStatus.Received)}>Recibida</SelectItem>
                    <SelectItem value={String(PurchaseOrderStatus.Cancelled)}>Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <SpinnerGap size={32} weight="bold" className="animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">{error}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Folio</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead className="hidden md:table-cell">Fecha</TableHead>
                    <TableHead className="hidden lg:table-cell">Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="hidden lg:table-cell">Pago</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                        No se encontraron órdenes de compra.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">PO-{order.purchaseOrderNumber}</TableCell>
                        <TableCell>{order.supplierName}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {new Date(order.date).toLocaleDateString("es-MX")}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          ${order.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(order.status)}>
                            {statusLabelMap[order.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge
                            variant={
                              order.paymentStatus === PurchasePaymentStatus.Paid
                                ? "default"
                                : "outline"
                            }
                          >
                            {order.paymentStatus === PurchasePaymentStatus.Paid
                              ? "Pagada"
                              : "Pendiente"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            {order.status === PurchaseOrderStatus.Draft ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1"
                                  onClick={() => handleConfirm(order)}
                                >
                                  <Checks size={14} weight="bold" />
                                  Confirmar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="gap-1 text-error hover:text-error"
                                  onClick={() => handleCancel(order)}
                                >
                                  <X size={14} weight="bold" />
                                  Cancelar
                                </Button>
                              </>
                            ) : null}

                            {(order.status === PurchaseOrderStatus.Pending ||
                              order.status === PurchaseOrderStatus.PartiallyReceived) ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1"
                                  onClick={() => openReceiveDialog(order)}
                                >
                                  <Truck size={14} weight="bold" />
                                  Recibir
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="gap-1 text-error hover:text-error"
                                  onClick={() => handleCancel(order)}
                                >
                                  <X size={14} weight="bold" />
                                  Cancelar
                                </Button>
                              </>
                            ) : null}

                            {order.status !== PurchaseOrderStatus.Cancelled &&
                            order.paymentStatus === PurchasePaymentStatus.Pending ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleMarkAsPaid(order)}
                              >
                                Marcar pagada
                              </Button>
                            ) : null}
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

        <Dialog
          open={createDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) resetCreateForm();
          }}
        >
          <DialogContent className="sm:max-w-[860px]">
            <form onSubmit={handleCreatePurchase}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShoppingCart size={18} weight="bold" />
                  Nueva orden de compra
                </DialogTitle>
                <DialogDescription>
                  Selecciona proveedor y agrega los productos a comprar.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="grid gap-2 md:col-span-2">
                    <Label>Proveedor</Label>
                    <Select
                      value={createForm.supplierId}
                      onValueChange={(value) =>
                        setCreateForm((current) => ({ ...current, supplierId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="purchase-date">Fecha</Label>
                    <Input
                      id="purchase-date"
                      type="date"
                      value={createForm.date}
                      onChange={(event) =>
                        setCreateForm((current) => ({ ...current, date: event.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="expected-date">Fecha esperada</Label>
                    <Input
                      id="expected-date"
                      type="date"
                      value={createForm.expectedDeliveryDate}
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          expectedDeliveryDate: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="tax-amount">Impuesto</Label>
                    <Input
                      id="tax-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={createForm.taxAmount}
                      onChange={(event) =>
                        setCreateForm((current) => ({ ...current, taxAmount: event.target.value }))
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Total estimado</Label>
                    <div className="h-10 rounded-md border bg-muted/40 px-3 flex items-center text-sm font-medium">
                      ${createTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="purchase-notes">Notas</Label>
                  <Textarea
                    id="purchase-notes"
                    value={createForm.notes}
                    onChange={(event) =>
                      setCreateForm((current) => ({ ...current, notes: event.target.value }))
                    }
                    rows={3}
                    placeholder="Notas opcionales de la orden"
                  />
                </div>

                <div className="space-y-3 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Items</p>
                    <Button type="button" size="sm" variant="outline" onClick={addItemRow}>
                      Agregar fila
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {createForm.items.map((item, index) => (
                      <div
                        key={`purchase-item-${index}`}
                        className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_140px_160px_auto]"
                      >
                        <Select
                          value={item.productId}
                          onValueChange={(value) => updateItemRow(index, "productId", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Producto" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} ({product.sku})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(event) =>
                            updateItemRow(index, "quantity", event.target.value)
                          }
                          placeholder="Cantidad"
                        />

                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.unitCost}
                          onChange={(event) =>
                            updateItemRow(index, "unitCost", event.target.value)
                          }
                          placeholder="Costo unitario"
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          className="text-error hover:text-error"
                          onClick={() => removeItemRow(index)}
                          disabled={createForm.items.length === 1}
                        >
                          Quitar
                        </Button>
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
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar OC"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog
          open={receiveDialogOpen}
          onOpenChange={(open) => {
            setReceiveDialogOpen(open);
            if (!open) {
              setSelectedOrder(null);
              setReceiveItems([]);
              setReceiveNotes("");
            }
          }}
        >
          <DialogContent className="sm:max-w-[760px]">
            <form onSubmit={handleReceive}>
              <DialogHeader>
                <DialogTitle>
                  Recepción de OC #{selectedOrder?.purchaseOrderNumber ?? ""}
                </DialogTitle>
                <DialogDescription>
                  Registra cantidades recibidas por producto.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-2 rounded-lg border p-3">
                  {receiveItems.map((item) => (
                    <div
                      key={item.purchaseOrderItemId}
                      className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_120px_140px] md:items-center"
                    >
                      <div>
                        <p className="text-sm font-medium">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">Pendiente: {item.maxReceivable}</p>
                      </div>

                      <Label htmlFor={`receive-${item.purchaseOrderItemId}`} className="text-xs">
                        Recibido
                      </Label>

                      <Input
                        id={`receive-${item.purchaseOrderItemId}`}
                        type="number"
                        min="0"
                        max={item.maxReceivable}
                        value={item.quantityReceived}
                        onChange={(event) =>
                          updateReceiveItem(item.purchaseOrderItemId, event.target.value)
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="receive-notes">Notas de recepción</Label>
                  <Textarea
                    id="receive-notes"
                    value={receiveNotes}
                    onChange={(event) => setReceiveNotes(event.target.value)}
                    rows={3}
                    placeholder="Observaciones de recepción (opcional)"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReceiveDialogOpen(false)}
                  disabled={receiving}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={receiving}>
                  {receiving ? "Registrando..." : "Registrar recepción"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={Boolean(orderToCancel)}
          title="Cancelar orden de compra"
          description={
            orderToCancel
              ? `Se cancelará la OC #${orderToCancel.purchaseOrderNumber}. Esta acción no se puede deshacer.`
              : ""
          }
          confirmLabel="Cancelar orden"
          cancelLabel="Volver"
          tone="destructive"
          isLoading={canceling}
          onConfirm={() => void confirmCancel()}
          onCancel={() => {
            if (canceling) return;
            setOrderToCancel(null);
          }}
        />
      </DashboardLayout>
    </PageTransition>
  );
}
