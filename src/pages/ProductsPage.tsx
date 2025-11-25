import { useEffect, useState, useMemo } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconHistory,
  IconArrowsDiff,
} from "@tabler/icons-react";
import type { ProductDto } from "@/api/productsApi";
import { getProducts, deleteProduct, getProductById } from "@/api/productsApi";
import { ProductFormDialog } from "@/components/products/ProductFormDialog";
import { StockAdjustmentDialog } from "@/components/products/StockAdjustmentDialog";
import { StockHistoryDialog } from "@/components/products/StockHistoryDialog";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { motion, useReducedMotion } from "framer-motion";

export function ProductsPage() {
  useDocumentTitle("Productos");
  const [searchParams, setSearchParams] = useSearchParams();
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

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [stockAdjustmentOpen, setStockAdjustmentOpen] = useState(false);
  const [stockHistoryOpen, setStockHistoryOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductDto | null>(
    null
  );

  const loadProducts = async (searchTerm?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProducts(searchTerm);
      setProducts(data);
      setCurrentPage(1); // Reset a primera página al cargar
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar productos"
      );
    } finally {
      setLoading(false);
    }
  };

  // Calcular productos paginados
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return products.slice(startIndex, endIndex);
  }, [products, currentPage, pageSize]);

  const totalPages = Math.ceil(products.length / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  useEffect(() => {
    loadProducts();
  }, []);

  // Manejar parámetro 'edit' de la URL para abrir el formulario de edición
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId && !dialogOpen) {
      // Intentar encontrar el producto en la lista cargada
      const productFromList = products.find((p) => p.id === editId);
      if (productFromList) {
        setEditingProduct(productFromList);
        setDialogOpen(true);
        // Limpiar el parámetro de la URL
        setSearchParams({}, { replace: true });
      } else if (!loading && products.length > 0) {
        // Si no está en la lista, cargar el producto desde la API
        getProductById(editId)
          .then((product) => {
            setEditingProduct(product);
            setDialogOpen(true);
            setSearchParams({}, { replace: true });
          })
          .catch((err) => {
            console.error("Error al cargar producto para editar:", err);
            setSearchParams({}, { replace: true });
          });
      } else if (!loading && products.length === 0) {
        // Lista vacía, intentar cargar directamente
        getProductById(editId)
          .then((product) => {
            setEditingProduct(product);
            setDialogOpen(true);
            setSearchParams({}, { replace: true });
          })
          .catch((err) => {
            console.error("Error al cargar producto para editar:", err);
            setSearchParams({}, { replace: true });
          });
      }
    }
  }, [searchParams, products, loading, dialogOpen, setSearchParams]);

  const handleSearch = () => {
    loadProducts(search);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const handleViewDetail = (product: ProductDto) => {
    navigate(`/products/${product.id}`);
  };

  const handleEdit = (product: ProductDto) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleDelete = async (product: ProductDto) => {
    if (!confirm(`¿Eliminar el producto "${product.name}"?`)) {
      return;
    }

    try {
      await deleteProduct(product.id);
      await loadProducts(search);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al eliminar producto");
    }
  };

  const handleAdjustStock = (product: ProductDto) => {
    setSelectedProduct(product);
    setStockAdjustmentOpen(true);
  };

  const handleViewHistory = (product: ProductDto) => {
    setSelectedProduct(product);
    setStockHistoryOpen(true);
  };

  const handleDialogClose = (saved: boolean) => {
    setDialogOpen(false);
    setEditingProduct(null);
    if (saved) {
      loadProducts(search);
    }
  };

  const handleRowKeyDown = (
    event: ReactKeyboardEvent<HTMLTableRowElement>,
    product: ProductDto
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleViewDetail(product);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(price);
  };

  return (
    <PageTransition>
      <DashboardLayout
        breadcrumbs={[
          { label: "Panel principal", href: "/dashboard" },
          { label: "Productos" },
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
            <h1 className="text-3xl font-bold">Productos</h1>
            <p className="text-slate-500 mt-1">
              Gestión de productos del catálogo
            </p>
          </div>
          <Button onClick={handleCreate}>
            <IconPlus size={20} className="mr-2" />
            Nuevo Producto
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
              <CardTitle>Catálogo de Productos</CardTitle>
              <CardDescription>
                Lista de todos los productos disponibles
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
                    placeholder="Buscar por nombre, marca, categoría, SKU o código de barras..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch} variant="secondary">
                  Buscar
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-error">{error}</div>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No se encontraron productos
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Marca</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Código de Barras</TableHead>
                          <TableHead className="text-right">Precio</TableHead>
                          <TableHead className="text-right">Stock</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedProducts.map((product) => (
                          <TableRow
                            key={product.id}
                            onClick={() => handleViewDetail(product)}
                            onKeyDown={(event) =>
                              handleRowKeyDown(event, product)
                            }
                            tabIndex={0}
                            className="cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
                            aria-label={`Ver producto ${product.name}`}
                          >
                            <TableCell className="font-medium">
                              {product.name}
                            </TableCell>
                            <TableCell>{product.brand || "-"}</TableCell>
                            <TableCell>{product.category || "-"}</TableCell>
                            <TableCell>{product.sku}</TableCell>
                            <TableCell>{product.barcode || "-"}</TableCell>
                            <TableCell className="text-right">
                              {formatPrice(product.price)}
                            </TableCell>
                            <TableCell className="text-right">
                              <span
                                className={
                                  product.stock <= 10
                                    ? "text-error font-semibold"
                                    : ""
                                }
                              >
                                {product.stock}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  product.isActive ? "default" : "secondary"
                                }
                              >
                                {product.isActive ? "Activo" : "Inactivo"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleEdit(product);
                                  }}
                                >
                                  <IconPencil size={16} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleDelete(product);
                                  }}
                                  className="text-error hover:text-error/90"
                                >
                                  <IconTrash size={16} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Historial de Stock"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleViewHistory(product);
                                  }}
                                >
                                  <IconHistory size={16} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Ajustar Stock"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleAdjustStock(product);
                                  }}
                                >
                                  <IconArrowsDiff size={16} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Controles de paginación */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">
                        Mostrando {(currentPage - 1) * pageSize + 1} a{" "}
                        {Math.min(currentPage * pageSize, products.length)} de{" "}
                        {products.length} productos
                      </span>
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor="pageSize"
                          className="text-sm text-slate-600"
                        >
                          | Filas por página:
                        </label>
                        <select
                          id="pageSize"
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="border border-slate-300 rounded px-2 py-1 text-sm"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => p - 1)}
                        disabled={!hasPrevPage}
                      >
                        <IconChevronLeft size={16} />
                        Anterior
                      </Button>
                      <span className="text-sm text-slate-600">
                        Página {currentPage} de {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => p + 1)}
                        disabled={!hasNextPage}
                      >
                        Siguiente
                        <IconChevronRight size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <ProductFormDialog
          open={dialogOpen}
          product={editingProduct}
          onClose={handleDialogClose}
        />

        <StockAdjustmentDialog
          open={stockAdjustmentOpen}
          productId={selectedProduct?.id ?? ""}
          productName={selectedProduct?.name ?? ""}
          currentStock={selectedProduct?.stock ?? 0}
          onClose={(adjusted) => {
            setStockAdjustmentOpen(false);
            setSelectedProduct(null);
            if (adjusted) loadProducts(search);
          }}
        />

        <StockHistoryDialog
          open={stockHistoryOpen}
          productId={selectedProduct?.id ?? ""}
          productName={selectedProduct?.name ?? ""}
          onClose={() => {
            setStockHistoryOpen(false);
            setSelectedProduct(null);
          }}
        />
      </DashboardLayout>
    </PageTransition>
  );
}
