import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  useGlobalSearch,
  type SearchHistoryItem,
} from "@/hooks/useGlobalSearch";
import { useGlobalSearchShortcut } from "@/hooks/useGlobalSearchShortcut";
import {
  Package,
  Users,
  ShoppingCart,
  Plus,
  LayoutDashboard,
  History,
  Clock,
  Tags,
  X,
  Loader2,
  Search,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Quick actions definition
const QUICK_ACTIONS = [
  {
    id: "new-sale",
    label: "Nueva Venta",
    description: "Ir al punto de venta",
    icon: Plus,
    path: "/pos",
    shortcut: "N",
  },
  {
    id: "new-product",
    label: "Nuevo Producto",
    description: "Crear un producto",
    icon: Package,
    path: "/products/new",
  },
  {
    id: "view-history",
    label: "Ver Historial de Ventas",
    description: "Lista de ventas recientes",
    icon: History,
    path: "/sales",
  },
] as const;

// Navigation items
const NAVIGATION_ITEMS = [
  {
    id: "nav-dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    id: "nav-products",
    label: "Productos",
    icon: Package,
    path: "/products",
  },
  {
    id: "nav-customers",
    label: "Clientes",
    icon: Users,
    path: "/customers",
  },
  {
    id: "nav-sales",
    label: "Ventas",
    icon: ShoppingCart,
    path: "/sales",
  },
  {
    id: "nav-categories",
    label: "Categorías",
    icon: Tags,
    path: "/categories",
  },
] as const;

interface GlobalSearchDialogProps {
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
}

export function GlobalSearchDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: GlobalSearchDialogProps = {}) {
  // Internal state for uncontrolled usage
  const [internalOpen, setInternalOpen] = useState(false);

  // Use controlled or internal state
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (value: boolean) => controlledOnOpenChange?.(value)
    : setInternalOpen;

  const navigate = useNavigate();
  const {
    query,
    setQuery,
    results,
    isLoading,
    error,
    history,
    addToHistory,
    removeFromHistory,
  } = useGlobalSearch();

  // Register global shortcut only if uncontrolled
  useGlobalSearchShortcut({
    enabled: !isControlled,
    onTrigger: () => setOpen(true),
  });

  // Clear query when dialog closes
  useEffect(() => {
    if (!open) {
      // Small delay to prevent flicker
      const timeout = setTimeout(() => {
        setQuery("");
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [open, setQuery]);

  // Handle navigation and close dialog
  const handleNavigate = useCallback(
    (path: string) => {
      setOpen(false);
      navigate(path);
    },
    [navigate, setOpen]
  );

  // Handle search result selection
  const handleSelectResult = useCallback(
    (type: "product" | "customer" | "sale", id: string) => {
      // Add current query to history
      if (query.trim()) {
        addToHistory(query);
      }

      switch (type) {
        case "product":
          handleNavigate(`/products/${id}`);
          break;
        case "customer":
          handleNavigate(`/customers`); // Navigate to customers, could add ?id=${id} for detail
          break;
        case "sale":
          handleNavigate(`/sales`); // Navigate to sales list
          break;
      }
    },
    [query, addToHistory, handleNavigate]
  );

  // Handle quick action selection
  const handleQuickAction = useCallback(
    (path: string) => {
      handleNavigate(path);
    },
    [handleNavigate]
  );

  // Handle history item selection
  const handleHistorySelect = useCallback(
    (item: SearchHistoryItem) => {
      setQuery(item.query);
    },
    [setQuery]
  );

  // Check if we have any results
  const hasResults =
    results.products.length > 0 ||
    results.customers.length > 0 ||
    results.sales.length > 0;

  const hasQuery = query.trim().length > 0;

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Búsqueda Global"
      description="Busca productos, clientes, ventas o navega rápidamente"
      shouldFilter={false}
    >
      <CommandInput
        placeholder="Buscar productos, clientes, ventas..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[400px]">
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Buscando...</span>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-destructive">
            <span>{error}</span>
          </div>
        )}

        {/* Empty state when searching */}
        {!isLoading && !error && hasQuery && !hasResults && (
          <CommandEmpty>
            No se encontraron resultados para "{query}"
          </CommandEmpty>
        )}

        {/* Search Results */}
        {!isLoading && hasQuery && hasResults && (
          <>
            {/* Products */}
            {results.products.length > 0 && (
              <CommandGroup heading="Productos">
                {results.products.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={`product-${product.id}`}
                    onSelect={() => handleSelectResult("product", product.id)}
                    className="flex items-center gap-3"
                  >
                    <Package className="h-4 w-4 text-blue-500" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="truncate font-medium">
                        {product.name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        SKU: {product.sku} • ${product.price.toFixed(2)} •
                        Stock: {product.stock}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Customers */}
            {results.customers.length > 0 && (
              <CommandGroup heading="Clientes">
                {results.customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={`customer-${customer.id}`}
                    onSelect={() => handleSelectResult("customer", customer.id)}
                    className="flex items-center gap-3"
                  >
                    <Users className="h-4 w-4 text-green-500" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="truncate font-medium">
                        {customer.name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {customer.email}
                        {customer.phone && ` • ${customer.phone}`}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Sales */}
            {results.sales.length > 0 && (
              <CommandGroup heading="Ventas">
                {results.sales.map((sale) => (
                  <CommandItem
                    key={sale.id}
                    value={`sale-${sale.id}`}
                    onSelect={() => handleSelectResult("sale", sale.id)}
                    className="flex items-center gap-3"
                  >
                    <ShoppingCart className="h-4 w-4 text-purple-500" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="truncate font-medium">
                        Venta #{sale.saleNumber}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {sale.customerName || "Cliente general"} • $
                        {sale.total.toFixed(2)}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}

        {/* Default view when no query */}
        {!hasQuery && !isLoading && (
          <>
            {/* Recent searches */}
            {history.length > 0 && (
              <>
                <CommandGroup heading="Búsquedas recientes">
                  {history.map((item) => (
                    <CommandItem
                      key={item.timestamp}
                      value={`history-${item.query}`}
                      onSelect={() => handleHistorySelect(item)}
                      className="flex items-center gap-3 group"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1">{item.query}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromHistory(item.query);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-opacity"
                        aria-label="Eliminar del historial"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* Quick Actions */}
            <CommandGroup heading="Acciones rápidas">
              {QUICK_ACTIONS.map((action) => (
                <CommandItem
                  key={action.id}
                  value={action.id}
                  onSelect={() => handleQuickAction(action.path)}
                  className="flex items-center gap-3"
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-md",
                      "bg-primary/10 text-primary"
                    )}
                  >
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">{action.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {action.description}
                    </span>
                  </div>
                  {"shortcut" in action && action.shortcut && (
                    <CommandShortcut>⌘{action.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            {/* Navigation */}
            <CommandGroup heading="Navegación">
              {NAVIGATION_ITEMS.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  onSelect={() => handleQuickAction(item.path)}
                  className="flex items-center gap-3"
                >
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{item.label}</span>
                  <MapPin className="h-3 w-3 ml-auto text-muted-foreground/50" />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>

      {/* Footer hint */}
      <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Search className="h-3 w-3" />
          <span>Escribe para buscar</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 inline-flex">
            <span className="text-xs">↵</span>
          </kbd>
          <span>Seleccionar</span>
          <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 inline-flex">
            <span className="text-xs">esc</span>
          </kbd>
          <span>Cerrar</span>
        </div>
      </div>
    </CommandDialog>
  );
}
