import { useCallback, useEffect, useRef, useState } from "react";
import {
  IconBarcode,
  IconPackage,
  IconChevronDown,
  IconLoader2,
} from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/Spinner";
import type { ProductDto } from "@/api/productsApi";

interface ProductAutoCompleteProps {
  /**
   * Current search term value
   */
  value: string;

  /**
   * Callback when search term changes
   */
  onChange: (value: string) => void;

  /**
   * List of search results/suggestions
   */
  results: ProductDto[];

  /**
   * Callback when a product is selected from suggestions
   */
  onSelect: (product: ProductDto) => void;

  /**
   * Callback when pressing Enter in the search field
   */
  onSubmit: () => Promise<void>;

  /**
   * Whether the search is in progress
   */
  isLoading?: boolean;

  /**
   * Whether a lookup/add operation is pending
   */
  isSubmitting?: boolean;

  /**
   * Error message to display
   */
  error?: string | null;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Currency formatter function
   */
  formatCurrency?: (value: number) => string;

  /**
   * Whether to show the submit button
   */
  showSubmitButton?: boolean;

  /**
   * Custom class for the container
   */
  className?: string;
}

const DEFAULT_CURRENCY_FORMATTER = (value: number) => `$${value.toFixed(2)}`;

/**
 * ProductAutoComplete Component
 *
 * A reusable autocomplete component for product search with:
 * - Real-time search suggestions
 * - Keyboard navigation (arrow keys, Enter)
 * - Product details (name, SKU, price, stock)
 * - Loading indicators
 * - Accessible dropdown
 */
export function ProductAutoComplete({
  value,
  onChange,
  results,
  onSelect,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
  error = null,
  placeholder = "Escanea código o busca por nombre",
  formatCurrency = DEFAULT_CURRENCY_FORMATTER,
  showSubmitButton = true,
  className = "",
}: ProductAutoCompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track keyboard navigation state
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        // Optional: close the dropdown by clearing input or handling it in parent
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (!value.trim()) {
        return;
      }

      switch (event.key) {
        case "ArrowDown": {
          event.preventDefault();
          setSelectedIndex((prev) => {
            const next = prev + 1;
            return next < results.length ? next : prev;
          });
          break;
        }
        case "ArrowUp": {
          event.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        }
        case "Enter": {
          event.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            onSelect(results[selectedIndex]);
            setSelectedIndex(-1);
          } else if (!isSubmitting) {
            void onSubmit();
          }
          break;
        }
        case "Escape": {
          event.preventDefault();
          setSelectedIndex(-1);
          break;
        }
        default:
          break;
      }
    },
    [value, results, selectedIndex, onSelect, onSubmit, isSubmitting]
  );

  const handleSelectProduct = (product: ProductDto) => {
    onSelect(product);
    setSelectedIndex(-1);
  };

  const hasSearchTerm = value.trim().length > 0;
  const showResults =
    hasSearchTerm && (isLoading || results.length > 0 || error);
  const showEmptyState = hasSearchTerm && !isLoading && results.length === 0;

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col gap-3 ${className}`}
    >
      {/* Search Input */}
      <div className="flex flex-col gap-2 md:flex-row">
        <div className="relative flex-1">
          <IconBarcode className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="pl-11"
            aria-label="Búsqueda de productos"
            aria-autocomplete="list"
            aria-expanded={showResults ? "true" : "false"}
            aria-controls={showResults ? "product-suggestions" : undefined}
          />
          {/* Loading indicator in input */}
          {isLoading && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              <IconLoader2 className="size-5 animate-spin text-primary" />
            </div>
          )}
        </div>

        {showSubmitButton && (
          <Button
            onClick={() => void onSubmit()}
            disabled={isSubmitting || !value.trim()}
            className="whitespace-nowrap"
          >
            {isSubmitting ? <Spinner size="sm" /> : null}
            <span>Agregar</span>
          </Button>
        )}
      </div>

      {/* Search Status Indicator */}
      {isLoading && hasSearchTerm && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <IconLoader2 className="size-4 animate-spin" />
          <span>Buscando...</span>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showResults && (
        <div
          id="product-suggestions"
          className="rounded-lg border border-dashed bg-slate-50 p-3 dark:bg-slate-900/30"
          role="listbox"
        >
          {isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700"
                />
              ))}
            </div>
          ) : showEmptyState ? (
            <div className="py-4 text-center">
              <IconPackage className="mx-auto mb-2 size-8 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground font-medium">
                {error || "Sin coincidencias"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Intenta con otro nombre, código o SKU
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((product, index) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleSelectProduct(product)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  role="option"
                  aria-selected={selectedIndex === index ? "true" : "false"}
                  className={`w-full rounded-md border transition-all ${
                    selectedIndex === index
                      ? "border-primary bg-primary/10 shadow-md dark:bg-primary/20"
                      : "border-transparent bg-white shadow-sm hover:border-primary hover:bg-primary/5 dark:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3 p-3">
                    {/* Product Avatar */}
                    <Avatar className="bg-primary/10 text-primary shrink-0">
                      <AvatarFallback className="text-xs font-bold">
                        {product.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Product Info */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {product.name}
                        </p>
                        {product.stock > 0 && product.stock <= 5 && (
                          <Badge
                            variant="outline"
                            className="bg-orange-50 text-orange-700 dark:bg-orange-950"
                          >
                            {product.stock} unid.
                          </Badge>
                        )}
                        {product.stock === 0 && (
                          <Badge
                            variant="destructive"
                            className="bg-red-50 text-red-700 dark:bg-red-950"
                          >
                            Sin stock
                          </Badge>
                        )}
                      </div>

                      {/* SKU and Price */}
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          SKU{" "}
                          <span className="font-mono font-semibold">
                            {product.sku?.toUpperCase() || "—"}
                          </span>
                        </p>
                        <span className="text-xs text-muted-foreground">·</span>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {formatCurrency(product.price)}
                        </p>
                      </div>
                    </div>

                    {/* Stock Status or Icon */}
                    {selectedIndex === index && (
                      <IconChevronDown className="size-5 text-primary shrink-0" />
                    )}
                    {selectedIndex !== index && product.stock > 0 && (
                      <div className="text-xs font-medium text-green-600 dark:text-green-400 shrink-0">
                        {product.stock} disponibles
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
