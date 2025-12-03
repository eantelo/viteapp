import { useState, useRef, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  IconSearch,
  IconPlus,
  IconPackage,
  IconBarcode,
  IconX,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ProductDto } from "@/api/productsApi";

interface ProductSearchSelectorProps {
  products: ProductDto[];
  onAddProduct: (product: ProductDto) => void;
  existingProductIds: string[];
  disabled?: boolean;
  formatCurrency: (amount: number) => string;
}

export function ProductSearchSelector({
  products,
  onAddProduct,
  existingProductIds,
  disabled = false,
  formatCurrency,
}: ProductSearchSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const searchLower = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.sku?.toLowerCase().includes(searchLower)
    );
  }, [products, search]);

  // Reset selectedIndex cuando cambia la búsqueda
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Scroll al elemento seleccionado
  useEffect(() => {
    if (open && listRef.current) {
      const selectedElement = listRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      selectedElement?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredProducts.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredProducts[selectedIndex]) {
          handleAddProduct(filteredProducts[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  const handleAddProduct = (product: ProductDto) => {
    if (existingProductIds.includes(product.id)) return;
    onAddProduct(product);
    setSearch("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return (
        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
          Agotado
        </Badge>
      );
    }
    if (stock <= 5) {
      return (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30"
        >
          Stock bajo: {stock}
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="text-[10px] px-1.5 py-0 text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30"
      >
        Stock: {stock}
      </Badge>
    );
  };

  return (
    <div className="w-full space-y-2">
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <div className="relative" onClick={(e) => e.preventDefault()}>
            <IconSearch
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              ref={inputRef}
              placeholder="Buscar producto por nombre o SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (!open) setOpen(true);
              }}
              onClick={() => {
                if (!open) setOpen(true);
              }}
              onFocus={() => {
                if (!open) setOpen(true);
              }}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              className="pl-10 pr-10 h-11 text-base"
            />
            {search && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearch("");
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Limpiar búsqueda"
              >
                <IconX size={16} />
              </button>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-(--radix-popover-trigger-width) p-0"
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <ScrollArea className="max-h-80">
            <div ref={listRef} className="py-1">
              <AnimatePresence mode="popLayout">
                {filteredProducts.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-8 text-center text-muted-foreground"
                  >
                    <IconPackage
                      size={32}
                      className="mx-auto mb-2 opacity-50"
                    />
                    <p className="text-sm">No se encontraron productos</p>
                    {search && (
                      <p className="text-xs mt-1">
                        Intenta con otro término de búsqueda
                      </p>
                    )}
                  </motion.div>
                ) : (
                  filteredProducts.map((product, index) => {
                    const isExisting = existingProductIds.includes(product.id);
                    const isSelected = selectedIndex === index;
                    const isOutOfStock = product.stock === 0;

                    return (
                      <motion.div
                        key={product.id}
                        data-index={index}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15, delay: index * 0.02 }}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors",
                          isSelected && "bg-accent",
                          isExisting && "opacity-50 cursor-not-allowed",
                          !isSelected && !isExisting && "hover:bg-accent/50"
                        )}
                        onClick={() => !isExisting && handleAddProduct(product)}
                      >
                        {/* Avatar/Icon del producto */}
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold",
                            isOutOfStock
                              ? "bg-destructive/10 text-destructive"
                              : "bg-primary/10 text-primary"
                          )}
                        >
                          {product.name.slice(0, 2).toUpperCase()}
                        </div>

                        {/* Info del producto */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">
                              {product.name}
                            </p>
                            {isExisting && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0"
                              >
                                Ya agregado
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <IconBarcode size={12} />
                              {product.sku || "Sin SKU"}
                            </span>
                            {getStockBadge(product.stock)}
                          </div>
                        </div>

                        {/* Precio y acción */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-semibold text-sm text-primary">
                            {formatCurrency(product.price)}
                          </span>
                          {!isExisting && !isOutOfStock && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddProduct(product);
                              }}
                            >
                              <IconPlus size={16} />
                            </Button>
                          )}
                          {isOutOfStock && (
                            <IconAlertTriangle
                              size={16}
                              className="text-destructive"
                            />
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>

          {/* Footer con atajo de teclado */}
          <div className="border-t px-3 py-2 bg-muted/50">
            <p className="text-[10px] text-muted-foreground">
              <kbd className="px-1 py-0.5 bg-background border rounded text-[10px]">
                ↑↓
              </kbd>{" "}
              para navegar •{" "}
              <kbd className="px-1 py-0.5 bg-background border rounded text-[10px]">
                Enter
              </kbd>{" "}
              para agregar •{" "}
              <kbd className="px-1 py-0.5 bg-background border rounded text-[10px]">
                Esc
              </kbd>{" "}
              para cerrar
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
