import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  IconPlus,
  IconMinus,
  IconTrash,
  IconAlertTriangle,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ProductDto } from "@/api/productsApi";

interface SaleItemForm {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface OrderProductTableEnhancedProps {
  items: SaleItemForm[];
  products: ProductDto[];
  onRemoveItem?: (index: number) => void;
  onItemChange?: (
    index: number,
    field: keyof SaleItemForm,
    value: string | number
  ) => void;
  formatCurrency: (amount: number) => string;
  readOnly?: boolean;
}

export function OrderProductTableEnhanced({
  items,
  products,
  onRemoveItem,
  onItemChange,
  formatCurrency,
  readOnly = false,
}: OrderProductTableEnhancedProps) {
  const [editingCell, setEditingCell] = useState<{
    index: number;
    field: "quantity" | "price";
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getProductDetails = (productId: string) => {
    return products.find((p) => p.id === productId);
  };

  // Focus en el input cuando se edita
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // Detectar nuevos items
  useEffect(() => {
    if (items.length > 0) {
      const lastItem = items[items.length - 1];
      setRecentlyAdded(lastItem.productId);
      const timer = setTimeout(() => setRecentlyAdded(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [items.length]);

  const handleIncrement = (index: number, currentQuantity: number) => {
    if (readOnly || !onItemChange) return;
    const product = getProductDetails(items[index].productId);
    if (product && product.stock > 0 && currentQuantity >= product.stock) {
      return; // No incrementar si ya alcanzó el stock
    }
    onItemChange(index, "quantity", currentQuantity + 1);
  };

  const handleDecrement = (index: number, currentQuantity: number) => {
    if (readOnly || !onItemChange) return;
    if (currentQuantity > 1) {
      onItemChange(index, "quantity", currentQuantity - 1);
    }
  };

  const startEditing = (
    index: number,
    field: "quantity" | "price",
    currentValue: number
  ) => {
    if (readOnly || !onItemChange) return;
    setEditingCell({ index, field });
    setEditValue(currentValue.toString());
  };

  const confirmEdit = () => {
    if (!editingCell || !onItemChange) return;

    const numValue = parseFloat(editValue);
    if (!isNaN(numValue) && numValue > 0) {
      onItemChange(editingCell.index, editingCell.field, numValue);
    }
    setEditingCell(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      confirmEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  const handleRemoveClick = (index: number) => {
    if (readOnly || !onRemoveItem) return;
    // Para items con mayor valor, pedir confirmación
    if (items[index].subtotal > 100) {
      setDeleteConfirm(index);
    } else {
      onRemoveItem(index);
    }
  };

  const getStockWarning = (productId: string, quantity: number) => {
    const product = getProductDetails(productId);
    if (!product) return null;

    if (quantity > product.stock) {
      return {
        type: "error" as const,
        message: `Excede stock (${product.stock})`,
      };
    }
    if (quantity === product.stock) {
      return {
        type: "warning" as const,
        message: "Stock completo",
      };
    }
    return null;
  };

  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {/* Resumen rápido */}
        <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
          <span>
            {items.length} producto{items.length !== 1 ? "s" : ""} •{" "}
            {totalItems} unidad{totalItems !== 1 ? "es" : ""}
          </span>
          <span className="font-medium text-foreground">
            Total: {formatCurrency(totalAmount)}
          </span>
        </div>

        {/* Tabla de productos */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="min-w-[220px]">Producto</TableHead>
                <TableHead className="w-[180px] text-center">
                  Cantidad
                </TableHead>
                <TableHead className="w-[130px] text-right">Precio</TableHead>
                <TableHead className="w-[130px] text-right">Subtotal</TableHead>
                <TableHead className="w-[70px] text-center">Quitar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => {
                  const product = getProductDetails(item.productId);
                  const stockWarning = getStockWarning(
                    item.productId,
                    item.quantity
                  );
                  const isRecentlyAdded = recentlyAdded === item.productId;
                  const isEditingQuantity =
                    editingCell?.index === index &&
                    editingCell?.field === "quantity";
                  const isEditingPrice =
                    editingCell?.index === index &&
                    editingCell?.field === "price";

                  return (
                    <motion.tr
                      key={item.productId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        backgroundColor: isRecentlyAdded
                          ? "rgba(34, 197, 94, 0.1)"
                          : "transparent",
                      }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "group border-b transition-colors",
                        stockWarning?.type === "error" &&
                          "bg-destructive/5 dark:bg-destructive/10"
                      )}
                    >
                      {/* Columna de Producto */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                              isRecentlyAdded
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-primary/10 text-primary"
                            )}
                          >
                            {item.productName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {item.productName}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {product && (
                                <span className="text-xs text-muted-foreground">
                                  SKU: {product.sku || "N/A"}
                                </span>
                              )}
                              {stockWarning && (
                                <Badge
                                  variant={
                                    stockWarning.type === "error"
                                      ? "destructive"
                                      : "outline"
                                  }
                                  className={cn(
                                    "text-[10px] px-1.5 py-0",
                                    stockWarning.type === "warning" &&
                                      "text-amber-600 border-amber-300"
                                  )}
                                >
                                  <IconAlertTriangle
                                    size={10}
                                    className="mr-0.5"
                                  />
                                  {stockWarning.message}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Columna de Cantidad */}
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleDecrement(index, item.quantity)
                                }
                                disabled={item.quantity <= 1}
                                className="h-9 w-9 p-0 rounded-l-lg rounded-r-none border-r-0"
                              >
                                <IconMinus size={16} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              Disminuir
                            </TooltipContent>
                          </Tooltip>

                          {isEditingQuantity ? (
                            <div className="flex items-center">
                              <Input
                                ref={inputRef}
                                type="number"
                                min="1"
                                step="1"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onBlur={confirmEdit}
                                className="h-9 w-16 text-center rounded-none border-x-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                              />
                            </div>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() =>
                                    startEditing(
                                      index,
                                      "quantity",
                                      item.quantity
                                    )
                                  }
                                  className={cn(
                                    "h-9 w-16 flex items-center justify-center",
                                    "text-center font-semibold text-base",
                                    "border-y bg-background",
                                    "hover:bg-muted transition-colors cursor-text"
                                  )}
                                >
                                  {Math.round(item.quantity)}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                Click para editar
                              </TooltipContent>
                            </Tooltip>
                          )}

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleIncrement(index, item.quantity)
                                }
                                className="h-9 w-9 p-0 rounded-r-lg rounded-l-none border-l-0"
                              >
                                <IconPlus size={16} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              Aumentar
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>

                      {/* Columna de Precio */}
                      <TableCell className="text-right">
                        {isEditingPrice ? (
                          <div className="flex items-center justify-end gap-1">
                            <Input
                              ref={inputRef}
                              type="number"
                              min="0"
                              step="0.01"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={handleKeyDown}
                              className="h-8 w-24 text-right"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={confirmEdit}
                            >
                              <IconCheck size={14} />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={cancelEdit}
                            >
                              <IconX size={14} />
                            </Button>
                          </div>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() =>
                                  startEditing(index, "price", item.price)
                                }
                                className="font-medium text-sm hover:text-primary hover:underline transition-colors cursor-text"
                              >
                                {formatCurrency(item.price)}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              Click para editar precio
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>

                      {/* Columna de Subtotal */}
                      <TableCell className="text-right">
                        <span className="font-semibold text-base">
                          {formatCurrency(item.subtotal)}
                        </span>
                      </TableCell>

                      {/* Columna de Acciones */}
                      <TableCell className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveClick(index)}
                              className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <IconTrash size={16} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            Quitar producto
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>

        {/* Footer con total */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 rounded-lg border">
          <div>
            <p className="text-sm text-muted-foreground">
              {items.length} producto{items.length !== 1 ? "s" : ""} en la orden
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(totalAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog
        open={deleteConfirm !== null}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm !== null && items[deleteConfirm] && (
                <>
                  Estás por eliminar{" "}
                  <strong>{items[deleteConfirm].productName}</strong> (
                  {items[deleteConfirm].quantity} unidad
                  {items[deleteConfirm].quantity !== 1 ? "es" : ""}) con un
                  subtotal de{" "}
                  <strong>
                    {formatCurrency(items[deleteConfirm].subtotal)}
                  </strong>
                  . Esta acción no se puede deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm !== null && onRemoveItem) {
                  onRemoveItem(deleteConfirm);
                  setDeleteConfirm(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <IconTrash size={16} className="mr-2" />
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
