import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageTransition } from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IconPlus,
  IconUpload,
  IconDownload,
  IconSearch,
  IconChevronDown,
  IconEdit,
  IconTrash,
  IconDots,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react";
import type { ProductDto } from "@/api/productsApi";
import {
  getProducts,
  deleteProduct,
  deactivateProduct,
} from "@/api/productsApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { motion, useReducedMotion } from "framer-motion";
import { ProductFormDialog } from "@/components/products/ProductFormDialog";
import { DeleteProductDialog } from "@/components/products/DeleteProductDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { IconFilter } from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { onProductUpdated } from "@/lib/product-events";

// Componente de filtros reutilizable para mobile y desktop
function FilterContent({
  search,
  handleSearchChange,
  expandedFilters,
  toggleFilter,
  availableCategories,
  selectedFilters,
  toggleFilterValue,
  availableBrands,
  clearAllFilters,
}: {
  search: string;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  expandedFilters: { category: boolean; brand: boolean; status: boolean };
  toggleFilter: (section: "category" | "brand" | "status") => void;
  availableCategories: string[];
  selectedFilters: { category: string[]; brand: string[]; status: string[] };
  toggleFilterValue: (
    section: "category" | "brand" | "status",
    value: string
  ) => void;
  availableBrands: string[];
  clearAllFilters: () => void;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
      {/* Search Bar */}
      <div className="pb-3">
        <label className="flex flex-col min-w-40 h-11 w-full">
          <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
            <div className="text-slate-500 dark:text-slate-400 flex bg-slate-100 dark:bg-slate-800 items-center justify-center pl-3 rounded-l-lg border-r-0">
              <IconSearch size={20} />
            </div>
            <Input
              className="rounded-l-none border-l-0 bg-slate-100 dark:bg-slate-800 h-full focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder="Search products..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>
        </label>
      </div>

      {/* Filter Accordions */}
      <div className="flex flex-col">
        {/* Category Filter */}
        <details
          className="flex flex-col border-t border-t-slate-200 dark:border-t-slate-700 py-2 group"
          open={expandedFilters.category}
        >
          <summary
            className="flex cursor-pointer items-center justify-between gap-6 py-2 list-none"
            onClick={(e) => {
              e.preventDefault();
              toggleFilter("category");
            }}
          >
            <p className="text-gray-800 dark:text-slate-200 text-sm font-medium leading-normal">
              Categoría
            </p>
            <IconChevronDown
              size={20}
              className={`text-gray-600 dark:text-slate-400 transition-transform ${
                expandedFilters.category ? "rotate-180" : ""
              }`}
            />
          </summary>
          {expandedFilters.category && (
            <div className="flex flex-col gap-2 pt-2 text-slate-600 dark:text-slate-400 text-sm">
              {availableCategories.length > 0 ? (
                availableCategories.map((category) => (
                  <label
                    key={category}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      className="form-checkbox rounded text-primary focus:ring-primary/50"
                      type="checkbox"
                      checked={selectedFilters.category.includes(category)}
                      onChange={() => toggleFilterValue("category", category)}
                    />
                    <span>{category}</span>
                  </label>
                ))
              ) : (
                <p className="text-xs text-slate-400">
                  No hay categorías disponibles
                </p>
              )}
            </div>
          )}
        </details>

        {/* Brand Filter */}
        <details
          className="flex flex-col border-t border-t-slate-200 dark:border-t-slate-700 py-2 group"
          open={expandedFilters.brand}
        >
          <summary
            className="flex cursor-pointer items-center justify-between gap-6 py-2 list-none"
            onClick={(e) => {
              e.preventDefault();
              toggleFilter("brand");
            }}
          >
            <p className="text-gray-800 dark:text-slate-200 text-sm font-medium leading-normal">
              Marca
            </p>
            <IconChevronDown
              size={20}
              className={`text-gray-600 dark:text-slate-400 transition-transform ${
                expandedFilters.brand ? "rotate-180" : ""
              }`}
            />
          </summary>
          {expandedFilters.brand && (
            <div className="flex flex-col gap-2 pt-2 text-slate-600 dark:text-slate-400 text-sm">
              {availableBrands.length > 0 ? (
                availableBrands.map((brand) => (
                  <label
                    key={brand}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      className="form-checkbox rounded text-primary focus:ring-primary/50"
                      type="checkbox"
                      checked={selectedFilters.brand.includes(brand)}
                      onChange={() => toggleFilterValue("brand", brand)}
                    />
                    <span>{brand}</span>
                  </label>
                ))
              ) : (
                <p className="text-xs text-slate-400">
                  No hay marcas disponibles
                </p>
              )}
            </div>
          )}
        </details>

        {/* Status Filter */}
        <details
          className="flex flex-col border-t border-t-slate-200 dark:border-t-slate-700 py-2 group"
          open={expandedFilters.status}
        >
          <summary
            className="flex cursor-pointer items-center justify-between gap-6 py-2 list-none"
            onClick={(e) => {
              e.preventDefault();
              toggleFilter("status");
            }}
          >
            <p className="text-gray-800 dark:text-slate-200 text-sm font-medium leading-normal">
              Estatus
            </p>
            <IconChevronDown
              size={20}
              className={`text-gray-600 dark:text-slate-400 transition-transform ${
                expandedFilters.status ? "rotate-180" : ""
              }`}
            />
          </summary>
          {expandedFilters.status && (
            <div className="flex flex-col gap-2 pt-2 text-slate-600 dark:text-slate-400 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  className="form-checkbox rounded text-primary focus:ring-primary/50"
                  type="checkbox"
                  checked={selectedFilters.status.includes("active")}
                  onChange={() => toggleFilterValue("status", "active")}
                />
                <span>Activo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  className="form-checkbox rounded text-primary focus:ring-primary/50"
                  type="checkbox"
                  checked={selectedFilters.status.includes("inactive")}
                  onChange={() => toggleFilterValue("status", "inactive")}
                />
                <span>Inactivo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  className="form-checkbox rounded text-primary focus:ring-primary/50"
                  type="checkbox"
                  checked={selectedFilters.status.includes("out-of-stock")}
                  onChange={() => toggleFilterValue("status", "out-of-stock")}
                />
                <span>Sin Stock</span>
              </label>
            </div>
          )}
        </details>
      </div>

      {/* Clear Filters Button */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-700 mt-2">
        <Button
          variant="ghost"
          className="w-full text-primary hover:bg-primary/10"
          onClick={clearAllFilters}
        >
          Limpiar Filtros
        </Button>
      </div>
    </div>
  );
}

export function ProductCatalogPage() {
  useDocumentTitle("Catálogo de Productos");
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
  const [filteredProducts, setFilteredProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({
    category: [] as string[],
    brand: [] as string[],
    status: [] as string[],
  });
  const [expandedFilters, setExpandedFilters] = useState({
    category: true,
    brand: false,
    status: false,
  });
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductDto | null>(
    null
  );
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  // Estados de paginación
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const loadProducts = async (searchTerm?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProducts(searchTerm);
      setProducts(data);

      // Extraer categorías y marcas únicas
      const categories = Array.from(
        new Set(data.map((p) => p.category).filter(Boolean))
      );
      const brands = Array.from(
        new Set(data.map((p) => p.brand).filter(Boolean))
      );
      setAvailableCategories(categories);
      setAvailableBrands(brands);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar productos"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Suscribirse a eventos de actualización de productos desde el chat
  useEffect(() => {
    const unsubscribe = onProductUpdated((detail) => {
      // Refrescar la lista cuando se actualiza un producto desde el chat
      if (
        detail.updateType === "stock" ||
        detail.updateType === "created" ||
        detail.updateType === "updated" ||
        detail.updateType === "deleted"
      ) {
        loadProducts();
      }
    });

    return unsubscribe;
  }, []);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    let result = [...products];

    // Filtrar por búsqueda
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.sku.toLowerCase().includes(searchLower) ||
          p.barcode.toLowerCase().includes(searchLower)
      );
    }

    // Filtrar por categoría
    if (selectedFilters.category.length > 0) {
      result = result.filter((p) =>
        selectedFilters.category.includes(p.category)
      );
    }

    // Filtrar por marca
    if (selectedFilters.brand.length > 0) {
      result = result.filter((p) => selectedFilters.brand.includes(p.brand));
    }

    // Filtrar por estatus
    if (selectedFilters.status.length > 0) {
      result = result.filter((p) => {
        if (selectedFilters.status.includes("active")) {
          return p.isActive && p.stock > 0;
        }
        if (selectedFilters.status.includes("inactive")) {
          return !p.isActive;
        }
        if (selectedFilters.status.includes("out-of-stock")) {
          return p.stock === 0;
        }
        return true;
      });
    }

    setFilteredProducts(result);
  }, [products, search, selectedFilters]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const toggleFilter = (section: "category" | "brand" | "status") => {
    setExpandedFilters((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleFilterValue = (
    section: "category" | "brand" | "status",
    value: string
  ) => {
    setSelectedFilters((prev) => {
      const currentValues = prev[section];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      return { ...prev, [section]: newValues };
    });
  };

  const clearAllFilters = () => {
    setSelectedFilters({
      category: [],
      brand: [],
      status: [],
    });
    setSearch("");
  };

  // Calcular productos paginados
  const paginatedProducts = React.useMemo(() => {
    const startIndex = pageIndex * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, pageIndex, pageSize]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize);

  const isExportDisabled = exporting || filteredProducts.length === 0;

  // Resetear a la primera página cuando cambien los filtros
  useEffect(() => {
    setPageIndex(0);
  }, [filteredProducts.length]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(price);
  };

  const getStatusBadgeClass = (isActive: boolean, stock: number) => {
    if (stock === 0) {
      return "px-2 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300";
    }
    if (!isActive) {
      return "px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300";
    }
    return "px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300";
  };

  const getStatusText = (isActive: boolean, stock: number) => {
    if (stock === 0) return "Sin Stock";
    return isActive ? "Activo" : "Inactivo";
  };

  const handleExportCsv = () => {
    if (filteredProducts.length === 0) {
      toast({
        title: "Sin datos para exportar",
        description: "No hay productos que coincidan con los filtros actuales.",
      });
      return;
    }

    setExporting(true);

    try {
      const exportedProducts = [...filteredProducts];
      const headers = [
        "Id",
        "Nombre",
        "Descripción",
        "SKU",
        "Código de barras",
        "Marca",
        "Categoría",
        "Precio",
        "Stock",
        "Estatus",
      ];

      const serializeCell = (value: string | number | null | undefined) => {
        const stringValue =
          value === null || value === undefined ? "" : String(value);
        const normalized = stringValue.replace(/\r?\n/g, " ");
        const escaped = normalized.replace(/"/g, '""');
        return `"${escaped}"`;
      };

      const rows = exportedProducts.map((product) => {
        const status = getStatusText(product.isActive, product.stock);

        return [
          product.id,
          product.name,
          product.description ?? "",
          product.sku,
          product.barcode,
          product.brand,
          product.category,
          product.price.toFixed(2),
          product.stock,
          status,
        ];
      });

      const csvRows = [headers, ...rows].map((row) =>
        row.map(serializeCell).join(",")
      );

      const csvContent = "\uFEFF" + csvRows.join("\r\n");
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);
      const now = new Date();
      const pad = (value: number) => value.toString().padStart(2, "0");
      const fileName = `productos_${now.getFullYear()}${pad(
        now.getMonth() + 1
      )}${pad(now.getDate())}_${pad(now.getHours())}${pad(
        now.getMinutes()
      )}${pad(now.getSeconds())}.csv`;

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 0);

      toast({
        title: "Exportación completada",
        description: `Se exportaron ${exportedProducts.length} productos.`,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Ocurrió un error durante la exportación.";
      toast({
        title: "Error al exportar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setShowFormDialog(true);
  };

  const handleViewDetail = (product: ProductDto) => {
    navigate(`/products/${product.id}`);
  };

  const handleEditProduct = (product: ProductDto) => {
    setSelectedProduct(product);
    setShowFormDialog(true);
  };

  const handleDeleteProduct = (product: ProductDto) => {
    setSelectedProduct(product);
    setShowDeleteDialog(true);
  };

  const confirmDeleteProduct = async () => {
    if (!selectedProduct) return;

    setDeletingProduct(true);
    setDeleteError(null);
    try {
      await deleteProduct(selectedProduct.id);
      toast({
        title: "Producto eliminado",
        description: `El producto "${selectedProduct.name}" ha sido eliminado correctamente.`,
      });
      await loadProducts();
      setShowDeleteDialog(false);
      setSelectedProduct(null);
      setDeleteError(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el producto";

      setDeleteError(errorMessage);

      // Si el error indica ventas asociadas, no cerrar el diálogo
      if (!errorMessage.toLowerCase().includes("ventas asociadas")) {
        toast({
          title: "Error al eliminar",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setDeletingProduct(false);
    }
  };

  const confirmDeactivateProduct = async () => {
    if (!selectedProduct) return;

    setDeletingProduct(true);
    setDeleteError(null);
    try {
      await deactivateProduct(selectedProduct.id);
      toast({
        title: "Producto desactivado",
        description: `El producto "${selectedProduct.name}" ha sido desactivado correctamente.`,
      });
      await loadProducts();
      setShowDeleteDialog(false);
      setSelectedProduct(null);
      setDeleteError(null);
    } catch (error) {
      toast({
        title: "Error al desactivar",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo desactivar el producto",
        variant: "destructive",
      });
    } finally {
      setDeletingProduct(false);
    }
  };

  const handleFormClose = async (saved: boolean) => {
    setShowFormDialog(false);
    if (saved) {
      toast({
        title: selectedProduct ? "Producto actualizado" : "Producto creado",
        description: selectedProduct
          ? "Los cambios se han guardado correctamente."
          : "El producto se ha creado correctamente.",
      });
      await loadProducts();
    }
    setSelectedProduct(null);
  };

  const applyMobileFilters = () => {
    setShowMobileFilters(false);
  };

  return (
    <PageTransition>
      <DashboardLayout
        breadcrumbs={[
          { label: "Panel principal", href: "/dashboard" },
          { label: "Catálogo de Productos" },
        ]}
        className="flex flex-1 flex-col gap-3 p-3 md:p-4 lg:p-6"
      >
        {/* Page Heading */}
        <motion.header
          className="flex flex-col gap-2 pb-2 md:pb-3"
          initial={motionInitial}
          animate={motionAnimate}
          transition={motionTransition}
        >
          <div className="flex flex-col gap-1">
            <h1 className="text-gray-900 dark:text-white text-xl md:text-2xl font-bold leading-tight">
              Catálogo de Productos
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-normal leading-snug">
              Administra tus productos, actualiza detalles y controla el
              inventario.
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 md:size-default"
              onClick={handleExportCsv}
              disabled={isExportDisabled}
              aria-busy={exporting}
              title={
                isExportDisabled && !exporting
                  ? "No hay productos para exportar con los filtros actuales."
                  : undefined
              }
            >
              {exporting ? (
                <>
                  <span
                    className="inline-flex h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin"
                    aria-hidden="true"
                  />
                  <span>Exportando...</span>
                </>
              ) : (
                <>
                  <IconDownload size={18} />
                  <span>Exportar</span>
                  <span className="hidden sm:inline">CSV</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 md:size-default"
            >
              <IconUpload size={18} />
              <span className="hidden sm:inline">Importar</span>
            </Button>
            <Button
              size="sm"
              className="flex items-center gap-2 md:size-default"
              onClick={handleCreateProduct}
            >
              <IconPlus size={18} />
              <span>Crear</span>
              <span className="hidden sm:inline">Producto</span>
            </Button>
          </div>
        </motion.header>

        <motion.div
          className="flex flex-col lg:flex-row gap-3 lg:gap-6 mt-2"
          initial={motionInitial}
          animate={motionAnimate}
          transition={{
            ...motionTransition,
            delay: prefersReducedMotion ? 0 : 0.08,
          }}
        >
          {/* Mobile Filter Button */}
          <div className="lg:hidden">
            <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <IconFilter size={18} />
                  <span>Filtros</span>
                  {(selectedFilters.category.length > 0 ||
                    selectedFilters.brand.length > 0 ||
                    selectedFilters.status.length > 0 ||
                    search.trim()) && (
                    <span className="ml-auto bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-medium">
                      {selectedFilters.category.length +
                        selectedFilters.brand.length +
                        selectedFilters.status.length +
                        (search.trim() ? 1 : 0)}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-full sm:w-96 overflow-y-auto"
              >
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <div className="mt-4 flex flex-col gap-4">
                  <FilterContent
                    search={search}
                    handleSearchChange={handleSearchChange}
                    expandedFilters={expandedFilters}
                    toggleFilter={toggleFilter}
                    availableCategories={availableCategories}
                    selectedFilters={selectedFilters}
                    toggleFilterValue={toggleFilterValue}
                    availableBrands={availableBrands}
                    clearAllFilters={clearAllFilters}
                  />
                  <Button
                    variant="outline"
                    className="w-full justify-center"
                    onClick={applyMobileFilters}
                  >
                    Aplicar filtros
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0">
            <FilterContent
              search={search}
              handleSearchChange={handleSearchChange}
              expandedFilters={expandedFilters}
              toggleFilter={toggleFilter}
              availableCategories={availableCategories}
              selectedFilters={selectedFilters}
              toggleFilterValue={toggleFilterValue}
              availableBrands={availableBrands}
              clearAllFilters={clearAllFilters}
            />
          </aside>

          {/* Product Table */}
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-500">{error}</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                      <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-800">
                        <tr>
                          <th scope="col" className="px-3 md:px-4 py-2">
                            Producto
                          </th>
                          <th
                            scope="col"
                            className="hidden sm:table-cell px-3 md:px-4 py-2"
                          >
                            SKU
                          </th>
                          <th
                            scope="col"
                            className="hidden md:table-cell px-3 md:px-4 py-2"
                          >
                            Marca
                          </th>
                          <th scope="col" className="px-3 md:px-4 py-2">
                            Precio
                          </th>
                          <th
                            scope="col"
                            className="hidden lg:table-cell px-3 md:px-4 py-2"
                          >
                            Stock
                          </th>
                          <th
                            scope="col"
                            className="hidden sm:table-cell px-3 md:px-4 py-2"
                          >
                            Estatus
                          </th>
                          <th scope="col" className="px-3 md:px-4 py-2">
                            <span className="sr-only">Acciones</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedProducts.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="text-center py-8 text-slate-500"
                            >
                              No se encontraron productos
                            </td>
                          </tr>
                        ) : (
                          paginatedProducts.map((product) => (
                            <tr
                              key={product.id}
                              onClick={() => handleViewDetail(product)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  handleViewDetail(product);
                                }
                              }}
                              tabIndex={0}
                              className="bg-white dark:bg-slate-900 border-b dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
                              aria-label={`Ver producto ${product.name}`}
                            >
                              <th
                                scope="row"
                                className="px-3 md:px-4 py-2 font-medium text-gray-900 dark:text-white"
                              >
                                <div>
                                  <p className="text-sm md:text-base">
                                    {product.name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {product.category}
                                  </p>
                                  {/* Mostrar SKU en mobile cuando la columna está oculta */}
                                  <p className="text-xs text-slate-400 sm:hidden mt-1">
                                    {product.sku}
                                  </p>
                                </div>
                              </th>
                              <td className="hidden sm:table-cell px-3 md:px-4 py-2 text-xs md:text-sm">
                                {product.sku}
                              </td>
                              <td className="hidden md:table-cell px-3 md:px-4 py-2 text-xs md:text-sm">
                                {product.brand}
                              </td>
                              <td className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium">
                                {formatPrice(product.price)}
                              </td>
                              <td
                                className={`hidden lg:table-cell px-3 md:px-4 py-2 text-xs md:text-sm ${
                                  product.stock <= 10 && product.stock > 0
                                    ? "text-orange-600 dark:text-orange-400"
                                    : product.stock === 0
                                    ? "text-red-600 dark:text-red-400"
                                    : ""
                                }`}
                              >
                                {product.stock} unidades
                                {product.stock <= 10 && product.stock > 0 && (
                                  <span className="ml-1">(Bajo)</span>
                                )}
                              </td>
                              <td className="hidden sm:table-cell px-3 md:px-4 py-2">
                                <span
                                  className={getStatusBadgeClass(
                                    product.isActive,
                                    product.stock
                                  )}
                                >
                                  {getStatusText(
                                    product.isActive,
                                    product.stock
                                  )}
                                </span>
                              </td>
                              <td
                                className="px-3 md:px-4 py-2 text-right"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                    >
                                      <IconDots className="h-4 w-4" />
                                      <span className="sr-only">
                                        Abrir menú
                                      </span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => handleEditProduct(product)}
                                      className="cursor-pointer"
                                    >
                                      <IconEdit className="mr-2 h-4 w-4" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleDeleteProduct(product)
                                      }
                                      className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                                    >
                                      <IconTrash className="mr-2 h-4 w-4" />
                                      Eliminar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2 md:p-3 border-t border-slate-200 dark:border-slate-700">
                    {/* Summary */}
                    <div className="text-xs md:text-sm font-normal text-slate-500 dark:text-slate-400">
                      Mostrando{" "}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {pageIndex * pageSize + 1}
                      </span>
                      {" - "}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {Math.min(
                          (pageIndex + 1) * pageSize,
                          filteredProducts.length
                        )}
                      </span>
                      {" de "}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {filteredProducts.length}
                      </span>{" "}
                      {filteredProducts.length === 1 ? "producto" : "productos"}
                      {products.length !== filteredProducts.length && (
                        <span className="text-slate-400">
                          {" ("}
                          {products.length} totales{")"}
                        </span>
                      )}
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center gap-2 sm:gap-4">
                      {/* Page Size Selector */}
                      <div className="hidden sm:flex items-center gap-2">
                        <Label
                          htmlFor="rows-per-page"
                          className="text-xs md:text-sm font-medium whitespace-nowrap"
                        >
                          Por página
                        </Label>
                        <Select
                          value={`${pageSize}`}
                          onValueChange={(value) => {
                            setPageSize(Number(value));
                            setPageIndex(0);
                          }}
                        >
                          <SelectTrigger
                            size="sm"
                            className="w-16 h-8"
                            id="rows-per-page"
                          >
                            <SelectValue placeholder={pageSize} />
                          </SelectTrigger>
                          <SelectContent side="top">
                            {[5, 10, 20, 30, 50].map((size) => (
                              <SelectItem key={size} value={`${size}`}>
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Page Info */}
                      <div className="text-xs md:text-sm font-medium whitespace-nowrap">
                        Página {pageIndex + 1} de {totalPages || 1}
                      </div>

                      {/* Navigation Buttons */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          className="hidden sm:flex h-8 w-8 p-0"
                          size="icon"
                          onClick={() => setPageIndex(0)}
                          disabled={
                            pageIndex === 0 || filteredProducts.length === 0
                          }
                          title="Primera página"
                        >
                          <span className="sr-only">Primera página</span>
                          <IconChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0"
                          size="icon"
                          onClick={() => setPageIndex(pageIndex - 1)}
                          disabled={
                            pageIndex === 0 || filteredProducts.length === 0
                          }
                          title="Página anterior"
                        >
                          <span className="sr-only">Página anterior</span>
                          <IconChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0"
                          size="icon"
                          onClick={() => setPageIndex(pageIndex + 1)}
                          disabled={
                            pageIndex >= totalPages - 1 ||
                            filteredProducts.length === 0
                          }
                          title="Página siguiente"
                        >
                          <span className="sr-only">Página siguiente</span>
                          <IconChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="hidden sm:flex h-8 w-8 p-0"
                          size="icon"
                          onClick={() => setPageIndex(totalPages - 1)}
                          disabled={
                            pageIndex >= totalPages - 1 ||
                            filteredProducts.length === 0
                          }
                          title="Última página"
                        >
                          <span className="sr-only">Última página</span>
                          <IconChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Diálogos */}
        <ProductFormDialog
          open={showFormDialog}
          product={selectedProduct}
          onClose={handleFormClose}
        />

        <DeleteProductDialog
          open={showDeleteDialog}
          product={selectedProduct}
          onConfirm={confirmDeleteProduct}
          onDeactivate={confirmDeactivateProduct}
          onCancel={() => {
            setShowDeleteDialog(false);
            setSelectedProduct(null);
            setDeleteError(null);
          }}
          loading={deletingProduct}
          error={deleteError}
        />
      </DashboardLayout>
    </PageTransition>
  );
}
