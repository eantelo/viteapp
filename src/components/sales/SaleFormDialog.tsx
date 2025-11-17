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
import { IconPlus, IconTrash } from "@tabler/icons-react";
import type { SaleDto, SaleCreateDto, SaleUpdateDto } from "@/api/salesApi";
import { createSale, updateSale } from "@/api/salesApi";
import type { CustomerDto } from "@/api/customersApi";
import { getCustomers } from "@/api/customersApi";
import type { ProductDto } from "@/api/productsApi";
import { getProducts } from "@/api/productsApi";

interface SaleFormDialogProps {
  open: boolean;
  sale: SaleDto | null;
  onClose: (saved: boolean) => void;
}

interface SaleItemForm {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export function SaleFormDialog({ open, sale, onClose }: SaleFormDialogProps) {
  const [customerId, setCustomerId] = useState("");
  const [saleDate, setSaleDate] = useState("");
  const [items, setItems] = useState<SaleItemForm[]>([]);

  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = sale !== null;

  useEffect(() => {
    if (open) {
      loadCustomers();
      loadProducts();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (sale) {
      setCustomerId(sale.customerId ?? "");
      setSaleDate(sale.date ? sale.date.split("T")[0] : "");
      setItems(
        sale.items.map((item) => ({
          productId: item.productId,
          productName: item.productName ?? "",
          quantity: item.quantity,
          price: item.price,
          subtotal: item.quantity * item.price,
        }))
      );
    } else {
      setCustomerId("");
      setSaleDate(new Date().toISOString().split("T")[0]);
      setItems([]);
    }
    setSelectedProduct("");
    setError(null);
  }, [open, sale]);

  const loadCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data.filter((c) => c.isActive));
    } catch (err) {
      console.error("Error al cargar clientes:", err);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data.filter((p) => p.isActive));
    } catch (err) {
      console.error("Error al cargar productos:", err);
    }
  };

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
      setError("El producto ya está agregado a la venta");
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
    setError(null);
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

  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

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
      } else {
        const dto: SaleCreateDto = {
          date: new Date(saleDate).toISOString(),
          customerId,
          items: baseItems,
        };
        await createSale(dto);
      }

      onClose(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Error al guardar la venta"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!loading) {
      onClose(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Orden de Venta" : "Nueva Orden de Venta"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Actualiza los datos de la orden de venta."
                : "Captura la información de la nueva orden de venta."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <div className="text-sm text-error bg-error/10 px-3 py-2 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
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

            <div className="border-t pt-4">
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

              {items.length > 0 && (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="w-32">Cantidad</TableHead>
                        <TableHead className="w-40 text-right">
                          Precio Unit.
                        </TableHead>
                        <TableHead className="w-40 text-right">
                          Subtotal
                        </TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {item.productName}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "quantity",
                                  e.target.value
                                )
                              }
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.price)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(item.subtotal)}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                              className="text-error hover:text-error/90"
                            >
                              <IconTrash size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-bold">
                          Total:
                        </TableCell>
                        <TableCell className="text-right font-bold text-lg">
                          {formatCurrency(totalAmount)}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              {items.length === 0 && (
                <div className="text-center py-8 text-gray-500 border rounded-md">
                  No hay productos agregados. Selecciona productos arriba.
                </div>
              )}
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
