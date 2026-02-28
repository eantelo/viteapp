import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageTransition } from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import {
  ArrowLeft,
  PencilSimple,
  ClockCounterClockwise,
  ArrowsLeftRight,
  Trash,
  Package,
  Barcode,
  Tag,
  FolderOpen,
  Cube,
  Warning,
} from "@phosphor-icons/react";
import type { ProductDto } from "@/api/productsApi";
import { getProductById, deleteProduct } from "@/api/productsApi";
import {
  onProductUpdated,
  type ProductUpdatedEventDetail,
} from "@/lib/product-events";
import { PAGE_LAYOUT_CLASS } from "@/lib/constants";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Estado del producto
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar el producto"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  // Suscribirse a eventos de actualización de productos desde el chat
  useEffect(() => {
    if (!id) return;

    const handleProductUpdate = (detail: ProductUpdatedEventDetail) => {
      const shouldRefresh =
        detail.productId === id ||
        (!detail.productId &&
          (detail.updateType === "stock" || detail.updateType === "updated"));

      if (shouldRefresh) {
        loadProduct();

        // Notificar al usuario según el tipo de actualización
        if (detail.updateType === "stock") {
          toast.info("Stock actualizado desde el asistente", {
            description: detail.productName
              ? `Se actualizó el stock de ${detail.productName}`
              : "Los datos del producto han sido actualizados",
          });
        } else if (detail.updateType === "updated") {
          // Solo mostrar notificación si tiene nombre de producto o mensaje específico
          // Evitar mostrar para la recarga forzada desde el chat
          if (
            detail.productName &&
            !detail.message?.includes("forzar recarga")
          ) {
            toast.info("Producto actualizado desde el asistente", {
              description: `Se actualizaron los datos de ${detail.productName}`,
            });
          }
        }
      }
    };

    const unsubscribe = onProductUpdated(handleProductUpdate);

    return () => {
      unsubscribe();
    };
  }, [id, loadProduct]);

  const handleEdit = () => {
    navigate(`/products/${id}/edit`);
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

  // Estado de carga
  if (loading) {
    return (
      <PageTransition>
        <DashboardLayout
          breadcrumbs={[
            { label: "Panel principal", href: "/dashboard" },
            { label: "Productos", href: "/products" },
            { label: "Cargando..." },
          ]}
          className={PAGE_LAYOUT_CLASS}
        >
          <div className="flex items-center gap-4 mb-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
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
            </div>
            <div>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </DashboardLayout>
      </PageTransition>
    );
  }

  // Estado de error
  if (error) {
    return (
      <PageTransition>
        <DashboardLayout
          breadcrumbs={[
            { label: "Panel principal", href: "/dashboard" },
            { label: "Productos", href: "/products" },
            { label: "Error" },
          ]}
          className={PAGE_LAYOUT_CLASS}
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
                    <ArrowLeft size={20} weight="bold" className="mr-2" />
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

  const profit = product.price - product.cost;
  const profitMargin = product.price > 0 ? (profit / product.price) * 100 : 0;

  return (
    <PageTransition>
      <DashboardLayout
        breadcrumbs={[
          { label: "Panel principal", href: "/dashboard" },
          { label: "Productos", href: "/products" },
          { label: product.name },
        ]}
        className={PAGE_LAYOUT_CLASS}
      >
        {/* Header con acciones */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/products")}
            >
              <ArrowLeft size={20} weight="bold" />
            </Button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold">
                  {product.name}
                </h1>
                <Badge
                  variant={product.isActive ? "default" : "destructive"}
                  className={!product.isActive ? "animate-pulse" : ""}
                >
                  {product.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                SKU: {product.sku}
                {product.barcode && ` • Código: ${product.barcode}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleEdit}>
              <PencilSimple size={20} weight="bold" className="mr-2" />
              Editar
            </Button>
            <Button
              variant="outline"
              className="text-error hover:text-error/90"
              onClick={handleDelete}
            >
              <Trash size={20} weight="bold" className="mr-2" />
              Eliminar
            </Button>
          </div>
        </div>

        {/* Banner de advertencia para productos inactivos */}
        {!product.isActive && (
          <div
            className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-center gap-3">
            <div className="bg-destructive/20 p-2 rounded-full">
              <Warning className="text-destructive" size={24} weight="bold" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-destructive">
                Producto Inactivo
              </p>
              <p className="text-sm text-muted-foreground">
                Este producto no está disponible para la venta. Puedes activarlo
                desde la opción de editar.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <PencilSimple size={16} weight="bold" className="mr-2" />
              Activar producto
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Información principal */}
          <div
            className="lg:col-span-2 space-y-4">
            {/* Detalles del producto */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Producto</CardTitle>
                <CardDescription>
                  Detalles generales del producto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {/* Descripción */}
                  {product.description && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Package size={16} weight="bold" />
                        Descripción
                      </h4>
                      <p className="text-base">{product.description}</p>
                    </div>
                  )}

                  {product.description && <Separator />}

                  {/* Identificadores */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Tag size={16} weight="bold" />
                        SKU
                      </h4>
                      <p className="font-mono text-lg">{product.sku}</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Barcode size={16} weight="bold" />
                        Código de Barras
                      </h4>
                      <p className="font-mono text-lg">
                        {product.barcode || "—"}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Marca y Categoría */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Cube size={16} weight="bold" />
                        Marca
                      </h4>
                      <p className="text-lg">{product.brand || "—"}</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <FolderOpen size={16} weight="bold" />
                        Categoría
                      </h4>
                      <p className="text-lg">{product.category || "—"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Precios */}
            <Card>
              <CardHeader>
                <CardTitle>Precios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 rounded-lg bg-primary/5">
                    <p className="text-sm text-muted-foreground mb-1">
                      Precio de Venta
                    </p>
                    <p className="text-3xl font-bold text-primary">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Costo</p>
                    <p className="text-3xl font-bold text-muted-foreground">
                      {formatPrice(product.cost)}
                    </p>
                  </div>
                  <div
                    className={`text-center p-4 rounded-lg ${
                      profit >= 0 ? "bg-success/10" : "bg-error/10"
                    }`}
                  >
                    <p className="text-sm text-muted-foreground mb-1">
                      Utilidad
                    </p>
                    <p
                      className={`text-3xl font-bold ${
                        profit >= 0 ? "text-success" : "text-error"
                      }`}
                    >
                      {formatPrice(profit)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ({profitMargin.toFixed(1)}%)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel lateral - Stock e información adicional */}
          <div
            className="space-y-4">
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
                  <p className="text-muted-foreground mt-1">unidades en stock</p>

                  <div className="mt-2 text-sm text-muted-foreground">
                    Reservado en ventas pendientes: {" "}
                    <span className="font-medium text-foreground">
                      {product.reservedStock}
                    </span>
                  </div>

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
                    <ArrowsLeftRight size={18} weight="bold" className="mr-2" />
                    Ajustar Stock
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setStockHistoryOpen(true)}
                  >
                    <ClockCounterClockwise size={18} weight="bold" className="mr-2" />
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
                  onClick={() => navigate("/products")}
                >
                  Ver Catálogo
                </Button>
              </CardContent>
            </Card>
          </div>
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
