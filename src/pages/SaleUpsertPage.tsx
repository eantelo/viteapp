import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageTransition } from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconPlus,
  IconShoppingCart,
} from "@tabler/icons-react";
import type { SaleDto, SaleCreateDto, SaleUpdateDto } from "@/api/salesApi";
import { getSaleById, createSale, updateSale } from "@/api/salesApi";
import type { CustomerDto } from "@/api/customersApi";
import { getCustomers } from "@/api/customersApi";
import type { ProductDto } from "@/api/productsApi";
import { getProducts } from "@/api/productsApi";
import { OrderProductTable } from "@/components/sales/OrderProductTable";

interface SaleItemForm {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
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

  // Datos de referencia
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");

  // Estado del formulario
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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

  const handleAddProduct = () => {
    if (!selectedProduct) {
      return;
    }

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) {
      return;
    }

    // Verificar si el producto ya está en la lista
    if (items.some((item) => item.productId === product.id)) {
      setFormError("El producto ya está agregado a la venta");
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
    setSelectedProduct("");
    setFormError(null);
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

  const handleEditProduct = (index: number, product: ProductDto) => {
    console.log("Editar producto:", product, "en índice:", index);
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
                      ? `Editar Orden #${sale?.saleNumber ?? ""}`
                      : "Nueva Orden de Venta"}
                  </h1>
                </div>
                <p className="text-slate-500 mt-1">
                  {isEditing
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
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                <IconDeviceFloppy size={20} className="mr-2" />
                {saving
                  ? "Guardando..."
                  : isEditing
                  ? "Actualizar Orden"
                  : "Crear Orden"}
              </Button>
            </div>
          </motion.div>

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
                    <div className="grid gap-2">
                      <Label htmlFor="sale-customer">
                        Cliente <span className="text-error">*</span>
                      </Label>
                      <Select value={customerId} onValueChange={setCustomerId}>
                        <SelectTrigger id="sale-customer">
                          <SelectValue placeholder="Selecciona un cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Productos */}
              <Card>
                <CardHeader>
                  <CardTitle>Productos</CardTitle>
                  <CardDescription>
                    Agrega los productos a la orden de venta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Selector de producto */}
                  <div className="flex items-end gap-2 mb-4">
                    <div className="flex-1">
                      <Label htmlFor="product-select">Agregar Producto</Label>
                      <Select
                        value={selectedProduct}
                        onValueChange={setSelectedProduct}
                      >
                        <SelectTrigger id="product-select">
                          <SelectValue placeholder="Selecciona un producto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - {formatCurrency(product.price)}{" "}
                              (Stock: {product.stock})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddProduct}
                      disabled={!selectedProduct}
                    >
                      <IconPlus size={16} className="mr-2" />
                      Agregar
                    </Button>
                  </div>

                  {/* Tabla de productos */}
                  {items.length > 0 ? (
                    <OrderProductTable
                      items={items}
                      products={products}
                      onRemoveItem={handleRemoveItem}
                      onItemChange={handleItemChange}
                      onEditProduct={handleEditProduct}
                      formatCurrency={formatCurrency}
                    />
                  ) : (
                    <div className="text-center py-12 text-gray-500 border rounded-md">
                      <IconShoppingCart
                        size={48}
                        className="mx-auto mb-4 opacity-50"
                      />
                      <p className="text-base">
                        No hay productos agregados. Selecciona productos desde
                        arriba.
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
              {/* Resumen de la orden */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumen</CardTitle>
                  <CardDescription>Detalles del total</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Productos</span>
                      <span>{items.length} artículo(s)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Cantidad total</span>
                      <span>
                        {items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                        unidad(es)
                      </span>
                    </div>
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-lg">Total</span>
                        <span className="font-bold text-2xl text-primary">
                          {formatCurrency(totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cliente seleccionado */}
              {customerId && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Cliente Seleccionado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const customer = customers.find(
                        (c) => c.id === customerId
                      );
                      if (!customer) return null;
                      return (
                        <div className="space-y-2">
                          <p className="font-semibold">{customer.name}</p>
                          {customer.email && (
                            <p className="text-sm text-slate-500">
                              {customer.email}
                            </p>
                          )}
                          {customer.phone && (
                            <p className="text-sm text-slate-500">
                              {customer.phone}
                            </p>
                          )}
                        </div>
                      );
                    })()}
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
