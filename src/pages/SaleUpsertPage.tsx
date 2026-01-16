import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageTransition } from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CustomerSelector } from "@/components/sales/CustomerSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconShoppingCart,
  IconAlertTriangle,
  IconLock,
  IconRefresh,
  IconTrash,
  IconCheck,
} from "@tabler/icons-react";
import type {
  PaymentMethodType,
  SaleDto,
  SaleCreateDto,
  SaleUpdateDto,
} from "@/api/salesApi";
import {
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
  closeSale,
  refundSale,
  completeSale,
  PaymentMethod,
} from "@/api/salesApi";
import type { CustomerDto } from "@/api/customersApi";
import { getCustomers } from "@/api/customersApi";
import type { ProductDto } from "@/api/productsApi";
import { getProducts } from "@/api/productsApi";
import { ProductSearchSelector } from "@/components/sales/ProductSearchSelector";
import { OrderProductTableEnhanced } from "@/components/sales/OrderProductTableEnhanced";

interface SaleItemForm {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

// Helper para obtener badge de estado
function getStatusBadge(status: SaleDto["status"]) {
  const variants: Record<
    SaleDto["status"],
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

  const config = variants[status];
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}

export function SaleUpsertPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const isEditing = !!id;

  const motionInitial = prefersReducedMotion
    ? { opacity: 1, y: 0 }
    : { opacity: 0, y: 16 };
  const motionAnimate = { opacity: 1, y: 0 };
  const easing: [number, number, number, number] = [0.16, 1, 0.3, 1];
  const motionTransition = {
    duration: prefersReducedMotion ? 0 : 0.45,
    ease: prefersReducedMotion ? undefined : easing,
  };

  // Estado de la venta existente (para edición)
  const [sale, setSale] = useState<SaleDto | null>(null);
  const [loading, setLoading] = useState(isEditing);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Campos del formulario
  const [customerId, setCustomerId] = useState("");
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<SaleItemForm[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>(
    PaymentMethod.Cash
  );
  const [amountReceived, setAmountReceived] = useState("");
  const [paymentReference, setPaymentReference] = useState("");

  // Datos de referencia
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  // Estado del formulario
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Estado para transiciones de estado
  const [statusAction, setStatusAction] = useState<
    "delete" | "close" | "refund" | "approve" | null
  >(null);

  // Solo se pueden editar ventas en estado Pending
  const isReadOnly = isEditing && sale?.status !== "Pending";

  useDocumentTitle(
    isEditing
      ? `Editar Orden #${sale?.saleNumber ?? ""}`
      : "Nueva Orden de Venta"
  );

  // Cargar la venta existente (para edición)
  const loadSale = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setLoadError(null);
      const data = await getSaleById(id);
      setSale(data);

      // Poblar el formulario con los datos de la venta
      setCustomerId(data.customerId ?? "");
      setSaleDate(data.date ? data.date.split("T")[0] : "");
      setItems(
        data.items.map((item) => ({
          productId: item.productId,
          productName: item.productName ?? "",
          quantity: item.quantity,
          price: item.price,
          subtotal: item.quantity * item.price,
        }))
      );

      if (data.payments && data.payments.length > 0) {
        const [firstPayment] = data.payments;
        setPaymentMethod(firstPayment.method);
        setAmountReceived(
          firstPayment.amountReceived !== undefined &&
            firstPayment.amountReceived !== null
            ? firstPayment.amountReceived.toString()
            : ""
        );
        setPaymentReference(firstPayment.reference ?? "");
      }
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Error al cargar la orden de venta"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Cargar clientes
  const loadCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data.filter((c) => c.isActive));
    } catch (err) {
      console.error("Error al cargar clientes:", err);
    }
  };

  // Cargar productos
  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data.filter((p) => p.isActive));
    } catch (err) {
      console.error("Error al cargar productos:", err);
    }
  };

  useEffect(() => {
    loadCustomers();
    loadProducts();
    if (isEditing) {
      loadSale();
    }
  }, [isEditing, loadSale]);

  // Cargar producto desde catálogo (quick sale)
  useEffect(() => {
    if (isEditing) return; // Solo en modo creación

    const quickSaleData = localStorage.getItem("quickSaleProduct");
    if (quickSaleData) {
      try {
        const product = JSON.parse(quickSaleData) as {
          productId: string;
          productName: string;
          quantity: number;
          price: number;
        };

        // Agregar el producto a la lista de items
        setItems((current) => {
          // Verificar si ya existe
          if (current.some((item) => item.productId === product.productId)) {
            return current;
          }
          return [
            ...current,
            {
              productId: product.productId,
              productName: product.productName,
              quantity: product.quantity,
              price: product.price,
              subtotal: product.quantity * product.price,
            },
          ];
        });

        toast.success(`Producto "${product.productName}" agregado a la orden`);
      } catch (error) {
        console.error("Error al cargar producto de quick sale:", error);
      } finally {
        // Limpiar localStorage
        localStorage.removeItem("quickSaleProduct");
      }
    }
  }, [isEditing]);

  const calculateSubtotal = (quantity: number, price: number) => {
    return quantity * price;
  };

  const handleAddProduct = (product: ProductDto) => {
    // Verificar si el producto ya está en la lista
    if (items.some((item) => item.productId === product.id)) {
      setFormError("El producto ya está agregado a la venta");
      return;
    }

    // Verificar stock
    if (product.stock === 0) {
      setFormError("El producto no tiene stock disponible");
      return;
    }

    const newItem: SaleItemForm = {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      price: product.price,
      subtotal: product.price,
    };

    setItems([...items, newItem]);
    setFormError(null);
    toast.success(`${product.name} agregado a la orden`);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof SaleItemForm,
    value: string | number
  ) => {
    const newItems = [...items];
    const item = newItems[index];

    if (field === "quantity") {
      const numValue =
        typeof value === "string" ? parseFloat(value) || 0 : value;
      item.quantity = numValue;
      item.subtotal = calculateSubtotal(item.quantity, item.price);
    } else if (field === "price") {
      const numValue =
        typeof value === "string" ? parseFloat(value) || 0 : value;
      item.price = numValue;
      item.subtotal = calculateSubtotal(item.quantity, item.price);
    }

    setItems(newItems);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      if (!customerId) {
        throw new Error("Debes seleccionar un cliente");
      }

      if (!saleDate) {
        throw new Error("Debes especificar la fecha de venta");
      }

      if (items.length === 0) {
        throw new Error("Debes agregar al menos un producto");
      }

      const baseItems = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      if (isEditing && sale) {
        const dto: SaleUpdateDto = {
          date: new Date(saleDate).toISOString(),
          customerId,
          items: baseItems,
        };
        await updateSale(sale.id, dto);
        toast.success("Orden de venta actualizada correctamente");
      } else {
        const dto: SaleCreateDto = {
          date: new Date(saleDate).toISOString(),
          customerId,
          items: baseItems,
        };
        await createSale(dto);
        toast.success("Orden de venta creada correctamente");
      }

      navigate("/sales");
    } catch (submitError) {
      setFormError(
        submitError instanceof Error
          ? submitError.message
          : "Error al guardar la orden de venta"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!saving) {
      navigate("/sales");
    }
  };

  // Funciones para transiciones de estado
  const handleDeleteSale = async () => {
    if (!sale) return;
    if (
      !confirm(
        `¿Eliminar la orden de venta #${sale.saleNumber}?\n\nEsta acción no se puede deshacer.`
      )
    ) {
      return;
    }
    setStatusAction("delete");
    try {
      await deleteSale(sale.id);
      toast.success("Orden de venta eliminada correctamente");
      navigate("/sales");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar la orden"
      );
      setStatusAction(null);
    }
  };

  const handleCloseSale = async () => {
    if (!sale) return;
    setStatusAction("close");
    try {
      await closeSale(sale.id);
      toast.success("Venta cerrada para contabilidad");
      await loadSale();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al cerrar la venta"
      );
    } finally {
      setStatusAction(null);
    }
  };

  const handleRefundSale = async () => {
    if (!sale) return;
    setStatusAction("refund");
    try {
      await refundSale(sale.id);
      toast.success("Venta reembolsada - Stock devuelto");
      await loadSale();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al reembolsar la venta"
      );
    } finally {
      setStatusAction(null);
    }
  };

  // Aprobar venta: guarda y completa con pago en efectivo
  const handleApproveSale = async () => {
    setSaving(true);
    setFormError(null);

    try {
      if (!customerId) {
        throw new Error("Debes seleccionar un cliente");
      }

      if (!saleDate) {
        throw new Error("Debes especificar la fecha de venta");
      }

      if (items.length === 0) {
        throw new Error("Debes agregar al menos un producto");
      }

      let normalizedAmountReceived: number | undefined;
      if (paymentMethod === PaymentMethod.Cash) {
        if (amountReceived.trim().length > 0) {
          const parsedAmount = Number(amountReceived);
          if (Number.isNaN(parsedAmount)) {
            throw new Error("El monto recibido debe ser un número válido");
          }
          normalizedAmountReceived = parsedAmount;
        } else {
          normalizedAmountReceived = totalAmount;
        }

        if (
          typeof normalizedAmountReceived === "number" &&
          normalizedAmountReceived < totalAmount
        ) {
          throw new Error("El monto recibido debe ser mayor o igual al total");
        }
      }

      const normalizedReference = paymentReference.trim() || undefined;

      const baseItems = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      let saleId: string;

      if (isEditing && sale) {
        // Actualizar la venta existente primero
        const dto: SaleUpdateDto = {
          date: new Date(saleDate).toISOString(),
          customerId,
          items: baseItems,
        };
        await updateSale(sale.id, dto);
        saleId = sale.id;
      } else {
        // Crear nueva venta
        const dto: SaleCreateDto = {
          date: new Date(saleDate).toISOString(),
          customerId,
          items: baseItems,
        };
        const newSale = await createSale(dto);
        saleId = newSale.id;
      }

      // Completar la venta con pago en efectivo por el total
      setStatusAction("approve");
      await completeSale(saleId, [
        {
          method: paymentMethod,
          amount: totalAmount,
          amountReceived: normalizedAmountReceived,
          reference: normalizedReference,
        },
      ]);

      toast.success("Venta aprobada y completada correctamente");
      navigate("/sales");
    } catch (submitError) {
      setFormError(
        submitError instanceof Error
          ? submitError.message
          : "Error al aprobar la venta"
      );
      setStatusAction(null);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  // Renderizar estado de carga
  if (loading) {
    return (
      <PageTransition>
        <DashboardLayout
          breadcrumbs={[
            { label: "Panel principal", href: "/dashboard" },
            { label: "Ventas", href: "/sales" },
            { label: "Cargando..." },
          ]}
          className="flex flex-1 flex-col gap-4 p-4"
        >
          <div className="flex items-center gap-4 mb-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </DashboardLayout>
      </PageTransition>
    );
  }

  // Renderizar estado de error
  if (loadError) {
    return (
      <PageTransition>
        <DashboardLayout
          breadcrumbs={[
            { label: "Panel principal", href: "/dashboard" },
            { label: "Ventas", href: "/sales" },
            { label: "Error" },
          ]}
          className="flex flex-1 flex-col gap-4 p-4"
        >
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <p className="text-error text-lg">{loadError}</p>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" onClick={() => navigate("/sales")}>
                    <IconArrowLeft size={20} className="mr-2" />
                    Volver a ventas
                  </Button>
                  <Button onClick={loadSale}>Reintentar</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </DashboardLayout>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <DashboardLayout
        breadcrumbs={[
          { label: "Panel principal", href: "/dashboard" },
          { label: "Ventas", href: "/sales" },
          {
            label: isEditing
              ? `Editar Orden #${sale?.saleNumber ?? ""}`
              : "Nueva Orden",
          },
        ]}
        className="flex flex-1 flex-col gap-4 p-4"
      >
        <form onSubmit={handleSubmit}>
          {/* Header con acciones */}
          <motion.div
            className="flex items-center justify-between mb-6"
            initial={motionInitial}
            animate={motionAnimate}
            transition={motionTransition}
          >
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={saving}
              >
                <IconArrowLeft size={20} />
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <IconShoppingCart size={28} className="text-primary" />
                  <h1 className="text-3xl font-bold">
                    {isEditing
                      ? `Orden #${sale?.saleNumber ?? ""}`
                      : "Nueva Orden de Venta"}
                  </h1>
                  {isEditing && sale && (
                    <span className="ml-2">{getStatusBadge(sale.status)}</span>
                  )}
                </div>
                <p className="text-slate-500 mt-1">
                  {isReadOnly
                    ? "Esta orden no puede ser editada porque ya no está en estado pendiente."
                    : isEditing
                    ? "Actualiza los datos de la orden de venta."
                    : "Captura la información de la nueva orden de venta."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={saving || statusAction !== null}
              >
                {isReadOnly ? "Volver" : "Cancelar"}
              </Button>

              {/* Botones según el estado de la venta */}
              {isEditing && sale?.status === "Pending" && (
                <>
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={saving || statusAction !== null}
                  >
                    <IconDeviceFloppy size={20} className="mr-2" />
                    {saving && statusAction !== "approve"
                      ? "Guardando..."
                      : "Guardar"}
                  </Button>
                  <Button
                    type="button"
                    disabled={saving || statusAction !== null}
                    onClick={handleApproveSale}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <IconCheck size={20} className="mr-2" />
                    {statusAction === "approve" ? "Aprobando..." : "Aprobar"}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={saving || statusAction !== null}
                    onClick={handleDeleteSale}
                  >
                    <IconTrash size={20} className="mr-2" />
                    {statusAction === "delete" ? "Eliminando..." : "Borrar"}
                  </Button>
                </>
              )}

              {/* Nueva venta - guardar como pendiente o aprobar */}
              {!isEditing && (
                <>
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={saving || statusAction !== null}
                  >
                    <IconDeviceFloppy size={20} className="mr-2" />
                    {saving && statusAction !== "approve"
                      ? "Guardando..."
                      : "Guardar"}
                  </Button>
                  <Button
                    type="button"
                    disabled={saving || statusAction !== null}
                    onClick={handleApproveSale}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <IconCheck size={20} className="mr-2" />
                    {statusAction === "approve" ? "Aprobando..." : "Aprobar"}
                  </Button>
                </>
              )}

              {/* Venta Completada - puede cerrar o reembolsar */}
              {isEditing && sale?.status === "Completed" && (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={statusAction !== null}
                    onClick={handleCloseSale}
                  >
                    <IconLock size={20} className="mr-2" />
                    {statusAction === "close"
                      ? "Cerrando..."
                      : "Cerrar para Contabilidad"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950"
                    disabled={statusAction !== null}
                    onClick={handleRefundSale}
                  >
                    <IconRefresh size={20} className="mr-2" />
                    {statusAction === "refund"
                      ? "Reembolsando..."
                      : "Reembolsar"}
                  </Button>
                </>
              )}
            </div>
          </motion.div>

          {/* Alerta de solo lectura */}
          {isReadOnly && (
            <motion.div
              className="mb-4 p-4 border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 rounded-lg flex items-center gap-3"
              initial={motionInitial}
              animate={motionAnimate}
              transition={motionTransition}
            >
              <IconAlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Orden no editable
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Solo las órdenes en estado "Pendiente" pueden ser modificadas.
                  Esta orden está en estado "
                  {sale?.status === "Completed"
                    ? "Completada"
                    : sale?.status === "Closed"
                    ? "Cerrada"
                    : sale?.status === "Cancelled"
                    ? "Cancelada"
                    : "Reembolsada"}
                  ".
                </p>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Información principal */}
            <motion.div
              className="lg:col-span-2 space-y-4"
              initial={motionInitial}
              animate={motionAnimate}
              transition={{
                ...motionTransition,
                delay: prefersReducedMotion ? 0 : 0.08,
              }}
            >
              {/* Datos de la orden */}
              <Card>
                <CardHeader>
                  <CardTitle>Datos de la Orden</CardTitle>
                  <CardDescription>
                    Información general de la orden de venta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {formError && (
                    <div className="text-sm text-error bg-error/10 px-3 py-2 rounded-md mb-4">
                      {formError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <CustomerSelector
                        customers={customers}
                        selectedCustomerId={customerId}
                        onSelectCustomer={setCustomerId}
                        onCustomerCreated={(newCustomer) => {
                          setCustomers((prev) => [...prev, newCustomer]);
                          toast.success(
                            `Cliente "${newCustomer.name}" creado y seleccionado`
                          );
                        }}
                        disabled={saving || isReadOnly}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="sale-date">
                        Fecha <span className="text-error">*</span>
                      </Label>
                      <Input
                        id="sale-date"
                        type="date"
                        value={saleDate}
                        onChange={(e) => setSaleDate(e.target.value)}
                        required
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2 mt-4">
                    <Label htmlFor="sale-notes">Notas (opcional)</Label>
                    <Textarea
                      id="sale-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Notas adicionales sobre la orden..."
                      rows={2}
                      disabled={isReadOnly}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Productos */}
              <Card>
                <CardHeader>
                  <CardTitle>Productos</CardTitle>
                  <CardDescription>
                    {isReadOnly
                      ? "Productos en la orden"
                      : "Agrega los productos a la orden de venta"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Buscador de productos mejorado - oculto en modo solo lectura */}
                  {!isReadOnly && (
                    <div>
                      <Label className="mb-2 block">
                        Buscar y Agregar Productos
                      </Label>
                      <ProductSearchSelector
                        products={products}
                        onAddProduct={handleAddProduct}
                        existingProductIds={items.map((i) => i.productId)}
                        disabled={saving}
                        formatCurrency={formatCurrency}
                      />
                    </div>
                  )}

                  {/* Tabla de productos mejorada */}
                  {items.length > 0 ? (
                    <OrderProductTableEnhanced
                      items={items}
                      products={products}
                      onRemoveItem={handleRemoveItem}
                      onItemChange={handleItemChange}
                      formatCurrency={formatCurrency}
                      readOnly={isReadOnly}
                    />
                  ) : (
                    <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                      <IconShoppingCart
                        size={48}
                        className="mx-auto mb-4 opacity-40"
                      />
                      <p className="text-base font-medium">
                        No hay productos en la orden
                      </p>
                      <p className="text-sm mt-1">
                        Usa el buscador para agregar productos
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Panel lateral - Resumen */}
            <motion.div
              className="space-y-4"
              initial={motionInitial}
              animate={motionAnimate}
              transition={{
                ...motionTransition,
                delay: prefersReducedMotion ? 0 : 0.16,
              }}
            >
              {/* Método de Pago */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Método de Pago</CardTitle>
                  <CardDescription>
                    Selecciona cómo se pagará la orden al aprobarla.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment-method">Método</Label>
                    <Select
                      value={paymentMethod.toString()}
                      onValueChange={(value) => {
                        const nextMethod = Number(value) as PaymentMethodType;
                        setPaymentMethod(nextMethod);
                        if (nextMethod !== PaymentMethod.Cash) {
                          setAmountReceived("");
                        }
                      }}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger id="payment-method">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={PaymentMethod.Cash.toString()}>
                          Efectivo
                        </SelectItem>
                        <SelectItem value={PaymentMethod.Card.toString()}>
                          Tarjeta
                        </SelectItem>
                        <SelectItem value={PaymentMethod.Voucher.toString()}>
                          Voucher
                        </SelectItem>
                        <SelectItem value={PaymentMethod.Transfer.toString()}>
                          Transferencia
                        </SelectItem>
                        <SelectItem value={PaymentMethod.Other.toString()}>
                          Otro
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {paymentMethod === PaymentMethod.Cash && (
                    <div className="space-y-2">
                      <Label htmlFor="amount-received">Monto recibido</Label>
                      <Input
                        id="amount-received"
                        type="number"
                        min={0}
                        step="0.01"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        placeholder={totalAmount ? totalAmount.toString() : "0"}
                        disabled={isReadOnly}
                      />
                      <p className="text-xs text-muted-foreground">
                        Si lo dejas vacío, se usará el total.
                      </p>
                    </div>
                  )}

                  {paymentMethod !== PaymentMethod.Cash && (
                    <div className="space-y-2">
                      <Label htmlFor="payment-reference">Referencia</Label>
                      <Input
                        id="payment-reference"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="Opcional"
                        disabled={isReadOnly}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Resumen de la orden */}
              <Card className="sticky top-4">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <IconShoppingCart size={20} className="text-primary" />
                    Resumen de la Orden
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Desglose */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Productos</span>
                        <span className="font-medium">
                          {items.length} artículo{items.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Cantidad total
                        </span>
                        <span className="font-medium">
                          {items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                          unidad
                          {items.reduce(
                            (sum, item) => sum + item.quantity,
                            0
                          ) !== 1
                            ? "es"
                            : ""}
                        </span>
                      </div>
                    </div>

                    {/* Lista resumida de productos */}
                    {items.length > 0 && (
                      <div className="border-t pt-3">
                        <p className="text-xs text-muted-foreground mb-2">
                          Productos en la orden:
                        </p>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                          {items.map((item) => (
                            <div
                              key={item.productId}
                              className="flex items-center justify-between text-xs bg-muted/50 px-2 py-1.5 rounded"
                            >
                              <span className="truncate flex-1 mr-2">
                                {item.productName}
                              </span>
                              <span className="shrink-0 text-muted-foreground">
                                x{item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Total */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-lg">Total</span>
                        <span className="font-bold text-2xl text-primary">
                          {formatCurrency(totalAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Indicador de estado */}
                    {items.length === 0 && (
                      <div className="text-center py-2 text-xs text-muted-foreground bg-muted/50 rounded">
                        Agrega productos para continuar
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Estado de la Venta - solo para ventas existentes */}
              {isEditing && sale && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      Estado de la Venta
                      {getStatusBadge(sale.status)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Info del estado actual */}
                    <div className="text-sm space-y-1">
                      {sale.status === "Pending" && (
                        <>
                          <p className="text-muted-foreground">
                            <span className="font-medium text-amber-600">
                              Stock reservado
                            </span>{" "}
                            - Los productos están apartados.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Puedes guardar o borrar esta orden.
                          </p>
                        </>
                      )}
                      {sale.status === "Completed" && (
                        <>
                          <p className="text-muted-foreground">
                            <span className="font-medium text-green-600">
                              Pagada y entregada
                            </span>{" "}
                            - Stock descontado.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Puedes cerrar para contabilidad o reembolsar.
                          </p>
                        </>
                      )}
                      {sale.status === "Closed" && (
                        <p className="text-muted-foreground">
                          <span className="font-medium text-slate-600">
                            Contabilizada
                          </span>{" "}
                          - Esta venta es inmutable.
                        </p>
                      )}
                      {sale.status === "Cancelled" && (
                        <p className="text-muted-foreground">
                          <span className="font-medium text-red-600">
                            Cancelada
                          </span>{" "}
                          - Stock devuelto al inventario.
                        </p>
                      )}
                      {sale.status === "Refunded" && (
                        <p className="text-muted-foreground">
                          <span className="font-medium text-purple-600">
                            Reembolsada
                          </span>{" "}
                          - Stock devuelto al inventario.
                        </p>
                      )}
                    </div>

                    {/* Botones de acción según estado */}
                    <div className="border-t pt-3 space-y-2">
                      {sale.status === "Pending" && (
                        <Button
                          type="button"
                          variant="destructive"
                          className="w-full"
                          disabled={statusAction !== null}
                          onClick={handleDeleteSale}
                        >
                          <IconTrash size={18} className="mr-2" />
                          {statusAction === "delete"
                            ? "Eliminando..."
                            : "Borrar Orden"}
                        </Button>
                      )}
                      {sale.status === "Completed" && (
                        <>
                          <Button
                            type="button"
                            variant="secondary"
                            className="w-full"
                            disabled={statusAction !== null}
                            onClick={handleCloseSale}
                          >
                            <IconLock size={18} className="mr-2" />
                            {statusAction === "close"
                              ? "Cerrando..."
                              : "Cerrar para Contabilidad"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950"
                            disabled={statusAction !== null}
                            onClick={handleRefundSale}
                          >
                            <IconRefresh size={18} className="mr-2" />
                            {statusAction === "refund"
                              ? "Reembolsando..."
                              : "Reembolsar Venta"}
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Acciones rápidas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate("/pos")}
                  >
                    Ir a Punto de Venta
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate("/customers")}
                  >
                    Gestionar Clientes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate("/products")}
                  >
                    Gestionar Productos
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </form>
      </DashboardLayout>
    </PageTransition>
  );
}
