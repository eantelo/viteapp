import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  IconPlus,
  IconMinus,
  IconTrash,
  IconPencil,
} from "@tabler/icons-react";
import type { ProductDto } from "@/api/productsApi";
import { cn } from "@/lib/utils";

interface SaleItemForm {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface OrderProductTableProps {
  items: SaleItemForm[];
  products: ProductDto[];
  onRemoveItem: (index: number) => void;
  onItemChange: (
    index: number,
    field: keyof SaleItemForm,
    value: string | number
  ) => void;
  onEditProduct?: (index: number, product: ProductDto) => void;
  formatCurrency: (amount: number) => string;
}

export function OrderProductTable({
  items,
  products,
  onRemoveItem,
  onItemChange,
  onEditProduct,
  formatCurrency,
}: OrderProductTableProps) {
  const [editingQuantityIndex, setEditingQuantityIndex] = useState<
    number | null
  >(null);

  const getProductDetails = (productId: string) => {
    return products.find((p) => p.id === productId);
  };

  const getStockStatus = (stock: number) => {
    if (stock < 10) return "low";
    if (stock < 20) return "medium";
    return "healthy";
  };

  const getStockColor = (stock: number) => {
    if (stock < 10) return "text-error bg-error/10";
    if (stock < 20) return "text-warning bg-warning/10";
    return "text-success bg-success/10";
  };

  const handleIncrement = (index: number, currentQuantity: number) => {
    onItemChange(index, "quantity", currentQuantity + 1);
  };

  const handleDecrement = (index: number, currentQuantity: number) => {
    if (currentQuantity > 1) {
      onItemChange(index, "quantity", currentQuantity - 1);
    }
  };

  const handleQuantityInputChange = (index: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    if (numValue > 0) {
      onItemChange(index, "quantity", numValue);
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <TooltipProvider>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-900">
              <TableHead className="min-w-[200px]">Producto</TableHead>
              <TableHead className="min-w-[100px] text-center">Stock</TableHead>
              <TableHead className="min-w-[140px] text-center">
                Cantidad
              </TableHead>
              <TableHead className="min-w-[120px] text-right">
                Precio Unit.
              </TableHead>
              <TableHead className="min-w-[120px] text-right">
                Subtotal
              </TableHead>
              <TableHead className="min-w-[80px] text-center">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => {
              const product = getProductDetails(item.productId);
              const stockStatus = product
                ? getStockStatus(product.stock)
                : "healthy";
              const stockColor = product
                ? getStockColor(product.stock)
                : "text-gray-600";

              return (
                <TableRow
                  key={index}
                  className="hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  {/* Columna de Producto */}
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {item.productName}
                          </p>
                          {product && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              SKU: {product.sku}
                            </p>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <div className="space-y-2">
                          <p className="font-semibold">{item.productName}</p>
                          {product && (
                            <>
                              <p className="text-xs">
                                <span className="font-medium">SKU:</span>{" "}
                                {product.sku}
                              </p>
                              <p className="text-xs max-w-xs break-words">
                                <span className="font-medium">
                                  Descripción:
                                </span>{" "}
                                {product.sku || "Sin descripción"}
                              </p>
                              <p className="text-xs">
                                <span className="font-medium">Stock:</span>{" "}
                                {product.stock} unidades
                              </p>
                              <p className="text-xs">
                                <span className="font-medium">Precio:</span>{" "}
                                {formatCurrency(product.price)}
                              </p>
                            </>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>

                  {/* Columna de Stock */}
                  <TableCell>
                    <div className="text-center">
                      {product && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "inline-block px-2 py-1 rounded text-sm font-semibold",
                                stockColor
                              )}
                            >
                              {product.stock} un.
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            {stockStatus === "low" && (
                              <p>⚠️ Stock bajo - Menos de 10 unidades</p>
                            )}
                            {stockStatus === "medium" && (
                              <p>⚠️ Stock limitado - Menos de 20 unidades</p>
                            )}
                            {stockStatus === "healthy" && (
                              <p>✓ Stock disponible</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>

                  {/* Columna de Cantidad */}
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDecrement(index, item.quantity)}
                        className="h-11 w-11 p-0 flex items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="Disminuir cantidad"
                      >
                        <IconMinus size={20} />
                      </Button>

                      {editingQuantityIndex === index ? (
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityInputChange(index, e.target.value)
                          }
                          onBlur={() => setEditingQuantityIndex(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              setEditingQuantityIndex(null);
                            }
                          }}
                          autoFocus
                          className="h-11 w-16 text-center font-semibold"
                        />
                      ) : (
                        <div
                          onClick={() => setEditingQuantityIndex(index)}
                          className="w-16 text-center font-semibold text-lg cursor-pointer px-2 py-2 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="Click para editar cantidad"
                        >
                          {Math.round(item.quantity)}
                        </div>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleIncrement(index, item.quantity)}
                        className="h-11 w-11 p-0 flex items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="Aumentar cantidad"
                      >
                        <IconPlus size={20} />
                      </Button>
                    </div>
                  </TableCell>

                  {/* Columna de Precio Unitario */}
                  <TableCell className="text-right font-medium">
                    <span className="text-gray-700 dark:text-gray-300">
                      {formatCurrency(item.price)}
                    </span>
                  </TableCell>

                  {/* Columna de Subtotal */}
                  <TableCell className="text-right font-semibold text-base">
                    <span className="text-gray-900 dark:text-gray-100">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </TableCell>

                  {/* Columna de Acciones */}
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      {product && onEditProduct && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditProduct(index, product)}
                              className="h-10 w-10 p-0 hover:text-primary"
                              title="Editar producto"
                            >
                              <IconPencil size={18} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            Editar producto
                          </TooltipContent>
                        </Tooltip>
                      )}

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveItem(index)}
                            className="h-10 w-10 p-0 hover:text-error"
                            title="Eliminar producto"
                          >
                            <IconTrash size={18} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          Eliminar producto
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {/* Fila de Total */}
            <TableRow className="bg-gray-50 dark:bg-gray-900 font-bold">
              <TableCell colSpan={4} className="text-right py-4">
                <span className="text-gray-700 dark:text-gray-300">Total:</span>
              </TableCell>
              <TableCell className="text-right text-lg py-4">
                <span className="text-gray-900 dark:text-gray-100">
                  {formatCurrency(totalAmount)}
                </span>
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Estado vacío */}
      {items.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 border rounded-md mt-4">
          <p className="text-base">
            No hay productos agregados. Selecciona productos desde arriba.
          </p>
        </div>
      )}
    </TooltipProvider>
  );
}
