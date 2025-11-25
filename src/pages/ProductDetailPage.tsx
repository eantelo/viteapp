import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageTransition } from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { StockAdjustmentDialog } from "@/components/products/StockAdjustmentDialog";
import { StockHistoryDialog } from "@/components/products/StockHistoryDialog";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconPencil,
  IconHistory,
  IconArrowsDiff,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import type { ProductDto, ProductUpdateDto } from "@/api/productsApi";
import {
  getProductById,
  updateProduct,
  deleteProduct,
  getCategories,
  getBrands,
} from "@/api/productsApi";
import {
  onProductUpdated,
  type ProductUpdatedEventDetail,
} from "@/lib/product-events";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  // Estado del producto
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado del formulario de edición
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Campos del formulario
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Sugerencias de marca y categoría
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  // Diálogos de stock
  const [stockAdjustmentOpen, setStockAdjustmentOpen] = useState(false);
  const [stockHistoryOpen, setStockHistoryOpen] = useState(false);

  useDocumentTitle(product ? `${product.name} - Producto` : "Producto");

  // Cargar el producto
  const loadProduct = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getProductById(id);
      setProduct(data);
      resetFormToProduct(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar el producto"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Cargar sugerencias
  const loadSuggestions = async () => {
    try {
      const [categoriesData, brandsData] = await Promise.all([
        getCategories(),
        getBrands(),
      ]);
      setCategories(categoriesData);
      setBrands(brandsData);
    } catch (err) {
      console.error("Error loading suggestions:", err);
    }
  };

  // Resetear el formulario al estado del producto
  const resetFormToProduct = (prod: ProductDto) => {
    setName(prod.name);
    setDescription(prod.description || "");
    setSku(prod.sku);
    setBarcode(prod.barcode || "");
    setBrand(prod.brand || "");
    setCategory(prod.category || "");
    setPrice(prod.price.toString());
    setIsActive(prod.isActive);
  };

  useEffect(() => {
    loadProduct();
    loadSuggestions();
  }, [loadProduct]);

  // Suscribirse a eventos de actualización de productos desde el chat
  useEffect(() => {
    const handleProductUpdate = (detail: ProductUpdatedEventDetail) => {
      // Si no hay producto cargado, no hacer nada
      if (!product || !id) return;

      // Refrescar si:
      // 1. El evento es para este producto específico (por ID)
      // 2. El evento no tiene ID (actualización general que podría afectar este producto)
      // 3. El tipo de actualización es stock, updated o created
      const shouldRefresh =
        detail.productId === id ||
        (!detail.productId &&
          (detail.updateType === "stock" || detail.updateType === "updated"));

      if (shouldRefresh) {
        // Recargar el producto para obtener los datos actualizados
        loadProduct();

        // Mostrar notificación al usuario
        if (detail.updateType === "stock") {
          toast.info("Stock actualizado desde el asistente", {
            description: detail.productName
              ? `Se actualizó el stock de ${detail.productName}`
              : "Los datos del producto han sido actualizados",
          });
        }
      }
    };

    // Suscribirse al evento
    const unsubscribe = onProductUpdated(handleProductUpdate);

    // Limpiar suscripción al desmontar
    return unsubscribe;
  }, [id, product, loadProduct]);

  const handleEdit = () => {
    setIsEditing(true);
    setFormError(null);
  };

  const handleCancelEdit = () => {
    if (product) {
      resetFormToProduct(product);
    }
    setIsEditing(false);
    setFormError(null);
  };

  const handleSave = async () => {
    if (!product) return;

    // Validaciones
    if (!name.trim()) {
      setFormError("El nombre del producto es requerido.");
      return;
    }
    if (!sku.trim()) {
      setFormError("El SKU es requerido.");
      return;
    }
    if (!price.trim()) {
      setFormError("El precio es requerido.");
      return;
    }

    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue < 0) {
      setFormError("El precio debe ser un número válido mayor o igual a 0.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const dto: ProductUpdateDto = {
        name: name.trim(),
        description: description.trim() || undefined,
        sku: sku.trim(),
        barcode: barcode.trim(),
        brand: brand.trim(),
        category: category.trim(),
        price: priceValue,
        stock: product.stock, // Stock no se modifica aquí
        isActive,
      };

      await updateProduct(product.id, dto);
      toast.success("Producto actualizado correctamente");

      // Recargar el producto para obtener los datos actualizados
      await loadProduct();
      setIsEditing(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Error al guardar el producto"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;

    if (
      !confirm(
        `¿Eliminar el producto "${product.name}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      await deleteProduct(product.id);
      toast.success("Producto eliminado correctamente");
      navigate("/products");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al eliminar el producto"
      );
    }
  };

  const handleStockAdjusted = () => {
    loadProduct();
  };

  const formatPrice = (priceValue: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(priceValue);
  };

  // Renderizar estado de carga
  if (loading) {
    return (
      <PageTransition>
        <DashboardLayout
          breadcrumbs={[
            { label: "Panel principal", href: "/dashboard" },
            { label: "Productos", href: "/products" },
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
  if (error) {
    return (
      <PageTransition>
        <DashboardLayout
          breadcrumbs={[
            { label: "Panel principal", href: "/dashboard" },
            { label: "Productos", href: "/products" },
            { label: "Error" },
          ]}
          className="flex flex-1 flex-col gap-4 p-4"
        >
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <p className="text-error text-lg">{error}</p>
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/products")}
                  >
                    <IconArrowLeft size={20} className="mr-2" />
                    Volver a productos
                  </Button>
                  <Button onClick={loadProduct}>Reintentar</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </DashboardLayout>
      </PageTransition>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <PageTransition>
      <DashboardLayout
        breadcrumbs={[
          { label: "Panel principal", href: "/dashboard" },
          { label: "Productos", href: "/products" },
          { label: product.name },
        ]}
        className="flex flex-1 flex-col gap-4 p-4"
      >
        {/* Header con acciones */}
        <motion.div
          className="flex items-center justify-between"
          initial={motionInitial}
          animate={motionAnimate}
          transition={motionTransition}
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/products")}
            >
              <IconArrowLeft size={20} />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{product.name}</h1>
                <Badge variant={product.isActive ? "default" : "secondary"}>
                  {product.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <p className="text-slate-500 mt-1">
                SKU: {product.sku}
                {product.barcode && ` | Código: ${product.barcode}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  <IconX size={20} className="mr-2" />
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <IconDeviceFloppy size={20} className="mr-2" />
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleEdit}>
                  <IconPencil size={20} className="mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  className="text-error hover:text-error/90"
                  onClick={handleDelete}
                >
                  <IconTrash size={20} className="mr-2" />
                  Eliminar
                </Button>
              </>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Información principal */}
          <motion.div
            className="lg:col-span-2"
            initial={motionInitial}
            animate={motionAnimate}
            transition={{
              ...motionTransition,
              delay: prefersReducedMotion ? 0 : 0.08,
            }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Información del Producto</CardTitle>
                <CardDescription>
                  {isEditing
                    ? "Modifica los datos del producto"
                    : "Detalles generales del producto"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {formError && (
                  <div className="text-sm text-error bg-error/10 px-3 py-2 rounded-md mb-4">
                    {formError}
                  </div>
                )}

                <div className="grid gap-6">
                  {/* Nombre */}
                  <div className="grid gap-2">
                    <Label htmlFor="name">
                      Nombre{" "}
                      {isEditing && <span className="text-error">*</span>}
                    </Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nombre del producto"
                        maxLength={200}
                      />
                    ) : (
                      <p className="text-lg font-medium">{product.name}</p>
                    )}
                  </div>

                  {/* Descripción */}
                  <div className="grid gap-2">
                    <Label htmlFor="description">Descripción</Label>
                    {isEditing ? (
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descripción del producto (opcional)"
                        maxLength={1000}
                        rows={3}
                      />
                    ) : (
                      <p className="text-slate-600">
                        {product.description || "Sin descripción"}
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* SKU y Código de barras */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="sku">
                        SKU {isEditing && <span className="text-error">*</span>}
                      </Label>
                      {isEditing ? (
                        <Input
                          id="sku"
                          value={sku}
                          onChange={(e) => setSku(e.target.value)}
                          placeholder="Código SKU"
                          maxLength={100}
                        />
                      ) : (
                        <p className="font-mono text-lg">{product.sku}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="barcode">Código de Barras</Label>
                      {isEditing ? (
                        <Input
                          id="barcode"
                          value={barcode}
                          onChange={(e) => setBarcode(e.target.value)}
                          placeholder="Código de barras"
                          maxLength={100}
                        />
                      ) : (
                        <p className="font-mono text-lg">
                          {product.barcode || "-"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Marca y Categoría */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="brand">Marca</Label>
                      {isEditing ? (
                        <Combobox
                          value={brand}
                          onValueChange={setBrand}
                          options={brands}
                          placeholder="Seleccionar marca"
                          emptyText="Escribe para crear una nueva marca"
                          maxLength={120}
                        />
                      ) : (
                        <p className="text-lg">{product.brand || "-"}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="category">Categoría</Label>
                      {isEditing ? (
                        <Combobox
                          value={category}
                          onValueChange={setCategory}
                          options={categories}
                          placeholder="Seleccionar categoría"
                          emptyText="Escribe para crear una nueva categoría"
                          maxLength={120}
                        />
                      ) : (
                        <p className="text-lg">{product.category || "-"}</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Precio */}
                  <div className="grid gap-2">
                    <Label htmlFor="price">
                      Precio{" "}
                      {isEditing && <span className="text-error">*</span>}
                    </Label>
                    {isEditing ? (
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                      />
                    ) : (
                      <p className="text-2xl font-bold text-primary">
                        {formatPrice(product.price)}
                      </p>
                    )}
                  </div>

                  {/* Estado (solo en edición) */}
                  {isEditing && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isActive"
                        checked={isActive}
                        onCheckedChange={(checked) =>
                          setIsActive(checked === true)
                        }
                      />
                      <Label
                        htmlFor="isActive"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Producto activo
                      </Label>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Panel lateral - Stock e información adicional */}
          <motion.div
            className="space-y-4"
            initial={motionInitial}
            animate={motionAnimate}
            transition={{
              ...motionTransition,
              delay: prefersReducedMotion ? 0 : 0.16,
            }}
          >
            {/* Tarjeta de Stock */}
            <Card>
              <CardHeader>
                <CardTitle>Inventario</CardTitle>
                <CardDescription>Stock actual del producto</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p
                    className={`text-5xl font-bold ${
                      product.stock <= 10
                        ? "text-error"
                        : product.stock <= 25
                        ? "text-warning"
                        : "text-success"
                    }`}
                  >
                    {product.stock}
                  </p>
                  <p className="text-slate-500 mt-1">unidades en stock</p>

                  {product.stock <= 10 && (
                    <Badge variant="destructive" className="mt-3">
                      Stock bajo
                    </Badge>
                  )}
                </div>

                <Separator className="my-4" />

                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setStockAdjustmentOpen(true)}
                  >
                    <IconArrowsDiff size={18} className="mr-2" />
                    Ajustar Stock
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setStockHistoryOpen(true)}
                  >
                    <IconHistory size={18} className="mr-2" />
                    Ver Historial
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tarjeta de Acciones rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/pos")}
                >
                  Ir a Punto de Venta
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/catalog")}
                >
                  Ver en Catálogo
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Diálogos de Stock */}
        <StockAdjustmentDialog
          open={stockAdjustmentOpen}
          productId={product.id}
          productName={product.name}
          currentStock={product.stock}
          onClose={(adjusted) => {
            setStockAdjustmentOpen(false);
            if (adjusted) handleStockAdjusted();
          }}
        />

        <StockHistoryDialog
          open={stockHistoryOpen}
          productId={product.id}
          productName={product.name}
          onClose={() => setStockHistoryOpen(false)}
        />
      </DashboardLayout>
    </PageTransition>
  );
}
