import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconSparkles,
  IconPackage,
  IconLoader2,
} from "@tabler/icons-react";
import type { ProductCreateDto, ProductUpdateDto } from "@/api/productsApi";
import {
  getProductById,
  createProduct,
  updateProduct,
  getCategories,
  getBrands,
  suggestProductMetadata,
  type ProductMetadataSuggestion,
} from "@/api/productsApi";

export function ProductUpsertPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const isEditing = Boolean(id);

  const motionInitial = prefersReducedMotion
    ? { opacity: 1, y: 0 }
    : { opacity: 0, y: 16 };
  const motionAnimate = { opacity: 1, y: 0 };
  const easing: [number, number, number, number] = [0.16, 1, 0.3, 1];
  const motionTransition = {
    duration: prefersReducedMotion ? 0 : 0.45,
    ease: prefersReducedMotion ? undefined : easing,
  };

  // Estado de carga inicial
  const [loading, setLoading] = useState(isEditing);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Campos del formulario
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Estado del formulario
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Sugerencias de marca y categoría
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  // Sugerencias de IA
  const [aiSuggestion, setAiSuggestion] =
    useState<ProductMetadataSuggestion | null>(null);
  const [aiStatus, setAiStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [aiError, setAiError] = useState<string | null>(null);
  const lastSuggestedNameRef = useRef<string>("");

  // Título dinámico
  useDocumentTitle(isEditing ? "Editar Producto" : "Nuevo Producto");

  // Cargar sugerencias de categorías y marcas
  const loadSuggestions = useCallback(async () => {
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
  }, []);

  // Cargar producto existente
  const loadProduct = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setLoadError(null);
      const data = await getProductById(id);

      setName(data.name);
      setDescription(data.description || "");
      setSku(data.sku);
      setBarcode(data.barcode || "");
      setBrand(data.brand || "");
      setCategory(data.category || "");
      setPrice(data.price.toString());
      setCost(data.cost.toString());
      setStock(data.stock.toString());
      setIsActive(data.isActive);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Error al cargar el producto"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSuggestions();
    if (isEditing) {
      loadProduct();
    }
  }, [isEditing, loadProduct, loadSuggestions]);

  // Sugerencias de IA basadas en el nombre
  const normalizedName = useMemo(() => name.trim(), [name]);

  useEffect(() => {
    // Solo para productos nuevos
    if (isEditing) return;

    if (normalizedName.length < 4) {
      setAiStatus("idle");
      setAiSuggestion(null);
      setAiError(null);
      lastSuggestedNameRef.current = "";
      return;
    }

    if (lastSuggestedNameRef.current === normalizedName) {
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setAiStatus("loading");
      setAiError(null);

      try {
        const suggestion = await suggestProductMetadata(
          normalizedName,
          controller.signal
        );
        if (controller.signal.aborted) return;

        lastSuggestedNameRef.current = normalizedName;
        const hasData = Boolean(
          suggestion.brand?.trim() ||
            suggestion.category?.trim() ||
            suggestion.description?.trim()
        );
        setAiSuggestion(suggestion);
        setAiStatus(hasData ? "ready" : "idle");

        // Auto-aplicar sugerencias si los campos están vacíos
        if (!brand && suggestion.brand) {
          setBrand(suggestion.brand);
        }
        if (!category && suggestion.category) {
          setCategory(suggestion.category);
        }
        if (!description && suggestion.description) {
          setDescription(suggestion.description);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Error fetching AI suggestion", err);
        setAiStatus("error");
        setAiError(
          err instanceof Error
            ? err.message
            : "No se pudo obtener la sugerencia"
        );
      }
    }, 600);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [normalizedName, isEditing, brand, category, description]);

  const aiConfidencePercent = useMemo(() => {
    if (aiSuggestion?.confidence == null) return null;
    return Math.round(aiSuggestion.confidence * 100);
  }, [aiSuggestion]);

  // Calcular utilidad
  const profit = useMemo(() => {
    const priceVal = parseFloat(price) || 0;
    const costVal = parseFloat(cost) || 0;
    return priceVal - costVal;
  }, [price, cost]);

  const profitMargin = useMemo(() => {
    const priceVal = parseFloat(price) || 0;
    if (priceVal <= 0) return 0;
    return (profit / priceVal) * 100;
  }, [price, profit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
    if (!isEditing && !stock.trim()) {
      setFormError("El stock inicial es requerido.");
      return;
    }

    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue < 0) {
      setFormError("El precio debe ser un número válido mayor o igual a 0.");
      return;
    }

    const costValue = parseFloat(cost) || 0;
    if (costValue < 0) {
      setFormError("El costo debe ser un número válido mayor o igual a 0.");
      return;
    }

    const stockValue = parseInt(stock, 10);
    if (!isEditing && (isNaN(stockValue) || stockValue < 0)) {
      setFormError(
        "El stock debe ser un número entero válido mayor o igual a 0."
      );
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (isEditing && id) {
        const dto: ProductUpdateDto = {
          name: name.trim(),
          description: description.trim() || undefined,
          sku: sku.trim(),
          barcode: barcode.trim(),
          brand: brand.trim(),
          category: category.trim(),
          price: priceValue,
          cost: costValue,
          stock: stockValue,
          isActive,
        };
        await updateProduct(id, dto);
        toast.success("Producto actualizado correctamente");
      } else {
        const dto: ProductCreateDto = {
          name: name.trim(),
          description: description.trim() || undefined,
          sku: sku.trim(),
          barcode: barcode.trim(),
          brand: brand.trim(),
          category: category.trim(),
          price: priceValue,
          cost: costValue,
          stock: stockValue,
        };
        await createProduct(dto);
        toast.success("Producto creado correctamente");
      }

      navigate("/products");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Error al guardar el producto"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);
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
          className="flex flex-1 flex-col gap-4 p-4"
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
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
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

  // Estado de error de carga
  if (loadError) {
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
                <p className="text-error text-lg">{loadError}</p>
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

  return (
    <PageTransition>
      <DashboardLayout
        breadcrumbs={[
          { label: "Panel principal", href: "/dashboard" },
          { label: "Productos", href: "/products" },
          { label: isEditing ? "Editar Producto" : "Nuevo Producto" },
        ]}
        className="flex flex-1 flex-col gap-4 p-4"
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
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
              >
                <IconArrowLeft size={20} />
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  {isEditing ? "Editar Producto" : "Nuevo Producto"}
                </h1>
                <p className="text-slate-500 mt-1">
                  {isEditing
                    ? "Modifica los datos del producto"
                    : "Completa la información del nuevo producto"}
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
                {saving ? (
                  <>
                    <IconLoader2 size={20} className="mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <IconDeviceFloppy size={20} className="mr-2" />
                    {isEditing ? "Guardar Cambios" : "Crear Producto"}
                  </>
                )}
              </Button>
            </div>
          </motion.div>

          {/* Contenido principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Columna izquierda - Formulario */}
            <motion.div
              className="lg:col-span-2 space-y-4"
              initial={motionInitial}
              animate={motionAnimate}
              transition={{
                ...motionTransition,
                delay: prefersReducedMotion ? 0 : 0.08,
              }}
            >
              {/* Error del formulario */}
              {formError && (
                <div className="text-sm text-error bg-error/10 px-4 py-3 rounded-lg border border-error/20">
                  {formError}
                </div>
              )}

              {/* Información Básica */}
              <Card>
                <CardHeader>
                  <CardTitle>Información Básica</CardTitle>
                  <CardDescription>
                    Datos principales del producto
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">
                      Nombre <span className="text-error">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Laptop Dell Inspiron 15"
                      maxLength={200}
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="sku">
                        SKU <span className="text-error">*</span>
                      </Label>
                      <Input
                        id="sku"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        placeholder="Ej: DELL-INSP-15-001"
                        maxLength={100}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="barcode">Código de Barras</Label>
                      <Input
                        id="barcode"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        placeholder="Ej: 7501234567890"
                        maxLength={100}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descripción detallada del producto (opcional)"
                      maxLength={1000}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Precios */}
              <Card>
                <CardHeader>
                  <CardTitle>Precios</CardTitle>
                  <CardDescription>
                    Precio de venta y costo del producto
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="price">
                        Precio de Venta <span className="text-error">*</span>
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="cost">Costo</Label>
                      <Input
                        id="cost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Utilidad</Label>
                      <div className="flex items-center h-10 px-3 rounded-md border bg-muted/50">
                        <span
                          className={`font-medium ${
                            profit >= 0 ? "text-success" : "text-error"
                          }`}
                        >
                          {formatPrice(profit)}
                        </span>
                        <span className="text-muted-foreground text-sm ml-2">
                          ({profitMargin.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Inventario */}
              <Card>
                <CardHeader>
                  <CardTitle>Inventario</CardTitle>
                  <CardDescription>Stock y estado del producto</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="stock">
                        {isEditing ? "Stock actual" : "Stock inicial"}{" "}
                        {!isEditing && <span className="text-error">*</span>}
                      </Label>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        placeholder="0"
                        disabled={isEditing}
                      />
                      {isEditing && (
                        <p className="text-xs text-muted-foreground">
                          Para ajustar el stock, usa la opción "Ajustar Stock"
                          desde el detalle del producto.
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label>Estado</Label>
                      <div className="flex items-center h-10 space-x-2">
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
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Categorización */}
              <Card>
                <CardHeader>
                  <CardTitle>Categorización</CardTitle>
                  <CardDescription>
                    Marca y categoría del producto
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="brand">Marca</Label>
                      <Combobox
                        value={brand}
                        onValueChange={setBrand}
                        options={brands}
                        placeholder="Seleccionar o escribir marca"
                        emptyText="Escribe para crear una nueva marca"
                        maxLength={120}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="category">Categoría</Label>
                      <Combobox
                        value={category}
                        onValueChange={setCategory}
                        options={categories}
                        placeholder="Seleccionar o escribir categoría"
                        emptyText="Escribe para crear una nueva categoría"
                        maxLength={120}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Columna derecha - Sugerencias y Preview */}
            <motion.div
              className="space-y-4"
              initial={motionInitial}
              animate={motionAnimate}
              transition={{
                ...motionTransition,
                delay: prefersReducedMotion ? 0 : 0.16,
              }}
            >
              {/* Sugerencias de IA (solo para nuevos productos) */}
              {!isEditing && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <IconSparkles size={18} className="text-primary" />
                      Sugerencias IA
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {aiStatus === "idle" && normalizedName.length < 4 && (
                      <p className="text-sm text-muted-foreground">
                        Escribe el nombre del producto (mínimo 4 caracteres)
                        para recibir sugerencias automáticas.
                      </p>
                    )}

                    {aiStatus === "loading" && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <IconLoader2 size={16} className="animate-spin" />
                        Analizando el nombre...
                      </div>
                    )}

                    {aiStatus === "error" && (
                      <p className="text-sm text-error">
                        {aiError ?? "No se pudo obtener sugerencias"}
                      </p>
                    )}

                    {aiStatus === "ready" && aiSuggestion && (
                      <div className="space-y-3">
                        {aiConfidencePercent !== null && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {aiConfidencePercent}% confianza
                            </Badge>
                          </div>
                        )}

                        <div className="space-y-2">
                          {aiSuggestion.brand && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                Marca:
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() =>
                                  setBrand(aiSuggestion.brand ?? "")
                                }
                              >
                                {aiSuggestion.brand}
                              </Button>
                            </div>
                          )}

                          {aiSuggestion.category && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                Categoría:
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() =>
                                  setCategory(aiSuggestion.category ?? "")
                                }
                              >
                                {aiSuggestion.category}
                              </Button>
                            </div>
                          )}
                        </div>

                        {aiSuggestion.description && (
                          <>
                            <Separator />
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                Descripción sugerida
                              </p>
                              <p className="text-sm text-slate-600 dark:text-slate-300">
                                {aiSuggestion.description}
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() =>
                                  setDescription(aiSuggestion.description ?? "")
                                }
                              >
                                Usar esta descripción
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {aiStatus === "idle" &&
                      normalizedName.length >= 4 &&
                      !aiSuggestion && (
                        <p className="text-sm text-muted-foreground">
                          No encontramos sugerencias para este producto.
                        </p>
                      )}
                  </CardContent>
                </Card>
              )}

              {/* Preview del producto */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <IconPackage size={18} />
                    Vista Previa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Icono o imagen placeholder */}
                    <div className="flex justify-center">
                      <div className="w-24 h-24 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <IconPackage size={40} className="text-slate-400" />
                      </div>
                    </div>

                    {/* Información */}
                    <div className="text-center space-y-1">
                      <h3 className="font-semibold text-lg">
                        {name.trim() || "Nombre del producto"}
                      </h3>
                      {(brand || category) && (
                        <p className="text-sm text-muted-foreground">
                          {brand}
                          {brand && category && " • "}
                          {category}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground font-mono">
                        {sku.trim() || "SKU-XXXX"}
                      </p>
                    </div>

                    <Separator />

                    {/* Precio y stock */}
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          {formatPrice(parseFloat(price) || 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">Precio</p>
                      </div>
                      <div>
                        <p
                          className={`text-2xl font-bold ${
                            parseInt(stock) <= 10
                              ? "text-error"
                              : "text-success"
                          }`}
                        >
                          {stock || "0"}
                        </p>
                        <p className="text-xs text-muted-foreground">Stock</p>
                      </div>
                    </div>

                    {/* Estado */}
                    <div className="flex justify-center">
                      <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </form>
      </DashboardLayout>
    </PageTransition>
  );
}
