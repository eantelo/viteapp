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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface PosItem {
  productId: string;
  name: string;
  sku?: string;
  quantity: number;
  price: number;
  stock: number;
}

interface OrderProductTablePosProps {
  items: PosItem[];
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onRemoveItem: (productId: string) => void;
  onQuantityChange?: (productId: string, quantity: number) => void;
  onEditProduct?: (productId: string) => void;
  formatCurrency: (amount: number) => string;
}

export function OrderProductTablePos({
  items,
  onIncrement,
  onDecrement,
  onRemoveItem,
  onQuantityChange,
  onEditProduct,
  formatCurrency,
}: OrderProductTablePosProps) {
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<number>(0);

  const handleIncrement = (
    productId: string,
    currentQuantity: number,
    stock: number
  ) => {
    if (stock > 0 && currentQuantity >= stock) {
      return; // No incrementar si ya alcanzó el máximo
    }
    onIncrement(productId);
  };

  const handleDecrement = (productId: string, currentQuantity: number) => {
    if (currentQuantity > 1) {
      onDecrement(productId);
    }
  };

  const handleStartEdit = (productId: string, currentQuantity: number) => {
    setEditingProductId(productId);
    setEditingQuantity(currentQuantity);
  };

  const handleConfirmEdit = (productId: string, stock: number) => {
    if (editingQuantity > 0 && editingQuantity <= stock) {
      onQuantityChange?.(productId, editingQuantity);
    }
    setEditingProductId(null);
  };

  const handleQuantityInputChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditingQuantity(numValue);
  };

  return (
    <TooltipProvider>
      <div className="rounded-xl border overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-900">
            <TableRow>
              <TableHead className="min-w-[200px]">Producto</TableHead>
              <TableHead className="min-w-[140px] text-center">
                Cantidad
              </TableHead>
              <TableHead className="min-w-[100px] text-right">Precio</TableHead>
              <TableHead className="min-w-[120px] text-right">Total</TableHead>
              <TableHead className="min-w-20 text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const isAtMaxStock =
                item.stock > 0 && item.quantity >= item.stock;

              return (
                <TableRow
                  key={item.productId}
                  className="hover:bg-gray-50 dark:hover:bg-gray-900 align-middle"
                >
                  {/* Columna de Producto */}
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-3 cursor-help">
                          <Avatar className="bg-primary/10 text-primary">
                            <AvatarFallback>
                              {item.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              SKU {item.sku ? item.sku.toUpperCase() : "—"}
                            </p>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <div className="space-y-2">
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-xs">
                            <span className="font-medium">SKU:</span>{" "}
                            {item.sku ? item.sku.toUpperCase() : "N/A"}
                          </p>
                          <p className="text-xs">
                            <span className="font-medium">Stock:</span>{" "}
                            {item.stock} unidades
                          </p>
                          <p className="text-xs">
                            <span className="font-medium">Precio:</span>{" "}
                            {formatCurrency(item.price)}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>

                  {/* Columna de Cantidad */}
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDecrement(item.productId, item.quantity)
                        }
                        className="h-11 w-11 p-0 flex items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="Disminuir cantidad"
                      >
                        <IconMinus size={20} />
                      </Button>

                      {editingProductId === item.productId ? (
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={editingQuantity}
                          onChange={(e) =>
                            handleQuantityInputChange(e.target.value)
                          }
                          onBlur={() =>
                            handleConfirmEdit(item.productId, item.stock)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleConfirmEdit(item.productId, item.stock);
                            }
                          }}
                          autoFocus
                          className="h-11 w-16 text-center font-semibold"
                        />
                      ) : (
                        <div
                          onClick={() =>
                            handleStartEdit(item.productId, item.quantity)
                          }
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
                        onClick={() =>
                          handleIncrement(
                            item.productId,
                            item.quantity,
                            item.stock
                          )
                        }
                        disabled={isAtMaxStock}
                        className={cn(
                          "h-11 w-11 p-0 flex items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors",
                          isAtMaxStock && "opacity-50 cursor-not-allowed"
                        )}
                        title="Aumentar cantidad"
                      >
                        <IconPlus size={20} />
                      </Button>
                    </div>
                    {isAtMaxStock && (
                      <p className="text-center text-xs text-orange-500 mt-1">
                        Stock máximo alcanzado
                      </p>
                    )}
                  </TableCell>

                  {/* Columna de Precio */}
                  <TableCell className="text-right font-medium">
                    <span className="text-gray-700 dark:text-gray-300">
                      {formatCurrency(item.price)}
                    </span>
                  </TableCell>

                  {/* Columna de Total */}
                  <TableCell className="text-right font-semibold text-base">
                    <span className="text-gray-900 dark:text-gray-100">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </TableCell>

                  {/* Columna de Acciones */}
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      {onEditProduct && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditProduct(item.productId)}
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
                            onClick={() => onRemoveItem(item.productId)}
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
          </TableBody>
        </Table>
      </div>

      {/* Estado vacío */}
      {items.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 border rounded-md mt-4">
          <p className="text-base">
            No hay productos agregados. Escanea un código o busca un producto.
          </p>
        </div>
      )}
    </TooltipProvider>
  );
}
