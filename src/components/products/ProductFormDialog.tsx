import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import type {
  ProductDto,
  ProductCreateDto,
  ProductUpdateDto,
} from "@/api/productsApi";
import {
  createProduct,
  updateProduct,
  getCategories,
  getBrands,
  suggestProductMetadata,
  type ProductMetadataSuggestion,
} from "@/api/productsApi";

interface ProductFormDialogProps {
  open: boolean;
  product: ProductDto | null;
  onClose: (saved: boolean) => void;
}

export function ProductFormDialog({
  open,
  product,
  onClose,
}: ProductFormDialogProps) {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [aiSuggestion, setAiSuggestion] =
    useState<ProductMetadataSuggestion | null>(null);
  const [aiStatus, setAiStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [aiError, setAiError] = useState<string | null>(null);
  const lastSuggestedNameRef = useRef<string>("");

  const isEditing = product !== null;
  const aiConfidencePercent = useMemo(() => {
    if (aiSuggestion?.confidence == null) {
      return null;
    }
    return Math.round(aiSuggestion.confidence * 100);
  }, [aiSuggestion]);

  useEffect(() => {
    if (open) {
      if (product) {
        setName(product.name);
        setDescription(product.description || "");
        setSku(product.sku);
        setBarcode(product.barcode || "");
        setBrand(product.brand || "");
        setCategory(product.category || "");
        setPrice(product.price.toString());
        setCost(product.cost.toString());
        setStock(product.stock.toString());
        setIsActive(product.isActive);
      } else {
        setName("");
        setDescription("");
        setSku("");
        setBarcode("");
        setBrand("");
        setCategory("");
        setPrice("");
        setCost("");
        setStock("");
        setIsActive(true);
      }
      setError(null);
      loadSuggestions();
      setAiSuggestion(null);
      setAiStatus("idle");
      setAiError(null);
      lastSuggestedNameRef.current = "";
    }
  }, [open, product]);

  const normalizedName = useMemo(() => name.trim(), [name]);

  useEffect(() => {
    if (!open || isEditing) {
      return;
    }

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
        if (controller.signal.aborted) {
          return;
        }

        lastSuggestedNameRef.current = normalizedName;
        const hasData = Boolean(
          suggestion.brand?.trim() ||
            suggestion.category?.trim() ||
            suggestion.description?.trim()
        );
        setAiSuggestion(suggestion);
        setAiStatus(hasData ? "ready" : "idle");

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
        if (controller.signal.aborted) {
          return;
        }
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
  }, [normalizedName, open, isEditing, brand, category, description]);

  const loadSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const [categoriesData, brandsData] = await Promise.all([
        getCategories(),
        getBrands(),
      ]);
      setCategories(categoriesData);
      setBrands(brandsData);
    } catch (err) {
      console.error("Error loading suggestions:", err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit called", { name, sku, price, stock });

    // Validar campos requeridos
    if (!name.trim()) {
      setError("El nombre del producto es requerido.");
      return;
    }

    if (!sku.trim()) {
      setError("El SKU es requerido.");
      return;
    }

    if (!price.trim()) {
      setError("El precio es requerido.");
      return;
    }

    if (!stock.trim()) {
      setError("El stock es requerido.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const priceValue = parseFloat(price);
      const costValue = parseFloat(cost) || 0;
      const stockValue = parseInt(stock, 10);

      console.log("Parsed values:", { priceValue, costValue, stockValue });

      if (isNaN(priceValue) || priceValue < 0) {
        throw new Error(
          "El precio debe ser un número válido mayor o igual a 0"
        );
      }

      if (costValue < 0) {
        throw new Error("El costo debe ser un número válido mayor o igual a 0");
      }

      if (isNaN(stockValue) || stockValue < 0) {
        throw new Error(
          "El stock debe ser un número entero válido mayor o igual a 0"
        );
      }

      if (isEditing) {
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
        console.log("Updating product:", dto);
        await updateProduct(product.id, dto);
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
        console.log("Creating product:", dto);
        await createProduct(dto);
      }

      console.log("Product saved successfully");
      onClose(true);
    } catch (err) {
      console.error("Error saving product:", err);
      setError(
        err instanceof Error ? err.message : "Error al guardar producto"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Producto" : "Nuevo Producto"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Modifica los datos del producto."
                : "Completa los datos del nuevo producto."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <div className="text-sm text-error bg-error/10 px-3 py-2 rounded-md">
                {error}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="name">
                Nombre <span className="text-error">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                  }
                }}
                placeholder="Ej: Laptop Dell Inspiron"
                maxLength={200}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sku">
                SKU <span className="text-error">*</span>
              </Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                  }
                }}
                placeholder="Ej: DELL-INSP-001"
                maxLength={100}
                required
              />
            </div>

            {!isEditing && (
              <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                {aiStatus === "loading" && (
                  <p className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                    Analizando el nombre para sugerir marca y categoría...
                  </p>
                )}
                {aiStatus === "error" && (
                  <p className="text-error">
                    {aiError ?? "No se pudo generar una sugerencia automática"}
                  </p>
                )}
                {aiStatus === "ready" && aiSuggestion && (
                  <div className="space-y-1">
                    <p className="text-slate-700 font-medium">
                      Sugerencia automática
                      {aiConfidencePercent !== null && (
                        <span className="ml-1 text-[11px] font-normal text-slate-500">
                          ({aiConfidencePercent}% de confianza)
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {aiSuggestion.brand && (
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          onClick={() => setBrand(aiSuggestion.brand ?? "")}
                        >
                          Usar marca "{aiSuggestion.brand}"
                        </Button>
                      )}
                      {aiSuggestion.category && (
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          onClick={() =>
                            setCategory(aiSuggestion.category ?? "")
                          }
                        >
                          Usar categoría "{aiSuggestion.category}"
                        </Button>
                      )}
                      {aiSuggestion.description && (
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          onClick={() =>
                            setDescription(aiSuggestion.description ?? "")
                          }
                        >
                          Usar descripción sugerida
                        </Button>
                      )}
                    </div>
                    {aiSuggestion.description && (
                      <div className="rounded-md bg-white/60 px-3 py-2 text-slate-600 shadow-sm">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">
                          Descripción sugerida
                        </p>
                        <p className="text-sm text-slate-700">
                          {aiSuggestion.description}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {aiStatus === "idle" &&
                  aiSuggestion &&
                  !aiSuggestion.brand &&
                  !aiSuggestion.category && (
                    <p className="text-slate-500">
                      No encontramos una sugerencia clara para este nombre.
                      Puedes completar los campos manualmente.
                    </p>
                  )}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="barcode">Código de Barras</Label>
              <Input
                id="barcode"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                  }
                }}
                placeholder="Ej: 7501234567890"
                maxLength={100}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">
                  Precio <span className="text-error">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                    }
                  }}
                  placeholder="0.00"
                  required
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                    }
                  }}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="stock">
                  Stock{" "}
                  {isEditing ? (
                    "(Solo lectura)"
                  ) : (
                    <span className="text-error">*</span>
                  )}
                </Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                    }
                  }}
                  placeholder="0"
                  required={!isEditing}
                  disabled={isEditing}
                />
                {isEditing && (
                  <p className="text-xs text-muted-foreground">
                    Para ajustar el stock, utiliza la opción "Ajustar Stock".
                  </p>
                )}
              </div>

              {/* Mostrar utilidad calculada */}
              {price && cost && (
                <div className="grid gap-2">
                  <Label>Utilidad</Label>
                  <div className="flex items-center h-10 px-3 rounded-md border bg-muted/50">
                    <span
                      className={`font-medium ${
                        parseFloat(price) - parseFloat(cost) >= 0
                          ? "text-success"
                          : "text-error"
                      }`}
                    >
                      $
                      {(
                        (parseFloat(price) || 0) - (parseFloat(cost) || 0)
                      ).toFixed(2)}
                    </span>
                    <span className="text-muted-foreground text-sm ml-2">
                      (
                      {parseFloat(price) > 0
                        ? (
                            ((parseFloat(price) - parseFloat(cost)) /
                              parseFloat(price)) *
                            100
                          ).toFixed(1)
                        : 0}
                      %)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {isEditing && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={(checked) => setIsActive(checked === true)}
                />
                <Label
                  htmlFor="isActive"
                  className="text-sm font-normal cursor-pointer"
                >
                  Producto activo
                </Label>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="brand">Marca</Label>
              <Combobox
                value={brand}
                onValueChange={setBrand}
                options={brands}
                placeholder="Ej: Dell"
                emptyText="Escribe para crear una nueva marca."
                disabled={loadingSuggestions}
                maxLength={120}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Categoría</Label>
              <Combobox
                value={category}
                onValueChange={setCategory}
                options={categories}
                placeholder="Ej: Laptops"
                emptyText="Escribe para crear una nueva categoría."
                disabled={loadingSuggestions}
                maxLength={120}
              />
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
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
