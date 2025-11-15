import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const isEditing = product !== null;

  useEffect(() => {
    if (open) {
      if (product) {
        setName(product.name);
        setSku(product.sku);
        setBarcode(product.barcode || "");
        setBrand(product.brand || "");
        setCategory(product.category || "");
        setPrice(product.price.toString());
        setStock(product.stock.toString());
        setIsActive(product.isActive);
      } else {
        setName("");
        setSku("");
        setBarcode("");
        setBrand("");
        setCategory("");
        setPrice("");
        setStock("");
        setIsActive(true);
      }
      setError(null);
      loadSuggestions();
    }
  }, [open, product]);

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
      const stockValue = parseInt(stock, 10);

      console.log("Parsed values:", { priceValue, stockValue });

      if (isNaN(priceValue) || priceValue < 0) {
        throw new Error(
          "El precio debe ser un número válido mayor o igual a 0"
        );
      }

      if (isNaN(stockValue) || stockValue < 0) {
        throw new Error(
          "El stock debe ser un número entero válido mayor o igual a 0"
        );
      }

      if (isEditing) {
        const dto: ProductUpdateDto = {
          name: name.trim(),
          sku: sku.trim(),
          barcode: barcode.trim(),
          brand: brand.trim(),
          category: category.trim(),
          price: priceValue,
          stock: stockValue,
          isActive,
        };
        console.log("Updating product:", dto);
        await updateProduct(product.id, dto);
      } else {
        const dto: ProductCreateDto = {
          name: name.trim(),
          sku: sku.trim(),
          barcode: barcode.trim(),
          brand: brand.trim(),
          category: category.trim(),
          price: priceValue,
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
                <Label htmlFor="stock">
                  Stock <span className="text-error">*</span>
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
                  required
                />
              </div>
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
