import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Coffee, MagnifyingGlass, List, User, Trash, CreditCard, Clock, Plus, Minus, X, Pause, ClockCounterClockwise } from "@phosphor-icons/react";
import { usePointOfSale } from "@/hooks/usePointOfSale";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { getProducts, getCategories, type ProductDto } from "@/api/productsApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PaymentDialog } from "@/components/sales/PaymentDialog";
import { type PaymentMethodType } from "@/api/salesApi";

export function RestaurantPosPage() {
  useDocumentTitle("Punto de Venta - Restaurante");
  const navigate = useNavigate();
  const { auth } = useAuth();

  // State
  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isHeldOrdersOpen, setIsHeldOrdersOpen] = useState(false);
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState("");

  // POS Hook
  const {
    items,
    customers,
    customerId,
    setCustomerId,
    addProductToOrder,
    incrementItem,
    decrementItem,
    removeItem,
    clearOrder,
    holdOrder,
    resumeHeldOrder,
    heldOrders,
    subtotal,
    taxAmount,
    total,
    submitSale,
    isSubmitting,
  } = usePointOfSale({
    onSaleCreated: (sale) => {
      toast.success("¡Orden completada!", {
        description: `Ticket #${sale.saleNumber} generado exitosamente.`,
      });
    },
    includeTax: true,
  });

  // Load initial data (only once on mount)
  useEffect(() => {
    const loadData = async () => {
      try {
        const [cats, prods] = await Promise.all([
          getCategories(),
          getProducts(),
        ]);
        setCategories(cats);
        setProducts(prods);
        if (cats.length > 0) {
          setSelectedCategory(cats[0]);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Error", {
          description: "No se pudieron cargar los productos o categorías.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Clock timer
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    if (localSearchTerm) {
      const term = localSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [products, selectedCategory, localSearchTerm]);

  const currentCustomer = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId]
  );

  const handlePaymentConfirm = async (
    paymentMethod: PaymentMethodType,
    amountReceived: number,
    reference: string
  ) => {
    await submitSale(paymentMethod, amountReceived, reference);
    setIsPaymentDialogOpen(false);
  };

  const handleHoldOrder = async () => {
    try {
      await holdOrder();
      toast.success("Orden guardada", {
        description: "La orden se ha puesto en espera correctamente.",
      });
    } catch (error) {
      toast.error("Error", {
        description: "No se pudo guardar la orden.",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex h-14 items-center justify-between bg-sidebar px-4 text-sidebar-foreground shadow-md z-10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white"
            onClick={() => navigate("/dashboard")}
          >
            <List weight="bold" className="size-6" />
          </Button>
          <h1 className="text-lg font-semibold tracking-tight">SalesNet POS</h1>
        </div>

        <div className="flex items-center gap-6 text-sm text-sidebar-foreground/70">
          <div className="flex items-center gap-2">
            <User weight="bold" className="size-4" />
            <span>{auth?.email || "Usuario"}</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span>Terminal 01</span>
          </div>
          <div className="flex items-center gap-2 font-medium text-white bg-sidebar-accent px-3 py-1 rounded-full">
            <Clock weight="bold" className="size-4" />
            <span>
              {format(currentTime, "EEEE, d MMM | h:mm a", { locale: es })}
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Categories */}
        <aside className="w-24 flex-col items-center gap-2 border-r bg-card py-4 hidden md:flex overflow-y-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-all w-20 h-20",
                selectedCategory === category
                  ? "bg-foreground text-background shadow-md scale-105"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  selectedCategory === category
                    ? "bg-foreground/80"
                    : "bg-muted"
                )}
              >
                {/* Placeholder icon - ideally map categories to icons */}
                <Coffee weight="duotone" className="size-6" />
              </div>
              <span className="text-[10px] font-medium text-center leading-tight line-clamp-2">
                {category}
              </span>
            </button>
          ))}
        </aside>

        {/* Main Content - Products */}
        <main className="flex-1 flex flex-col bg-muted/50 relative">
          {/* Search Bar */}
          <div className="p-4 bg-card border-b flex gap-3">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlass weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar producto..."
                className="pl-9 bg-muted border-border focus-visible:ring-ring"
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
              />
            </div>
            {/* Mobile Category Selector (visible only on small screens) */}
            <div className="md:hidden flex-1 overflow-x-auto flex gap-2 pb-1">
              {categories.map((cat) => (
                <Badge
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  className="whitespace-nowrap cursor-pointer"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <ScrollArea className="flex-1 p-4">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-20">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addProductToOrder(product)}
                    className="group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md hover:border-border active:scale-95"
                  >
                    <div className="aspect-[4/3] w-full bg-muted flex items-center justify-center relative">
                      {/* Product Image Placeholder */}
                      <Coffee weight="duotone" className="size-12 text-muted-foreground/50" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                    </div>
                    <div className="p-3 text-left">
                      <h3 className="font-semibold text-foreground line-clamp-2 text-sm leading-tight min-h-[2.5em]">
                        {product.name}
                      </h3>
                      <p className="mt-1 font-bold text-foreground/80">
                        {formatCurrency(product.price)}
                      </p>
                    </div>
                  </button>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <MagnifyingGlass weight="bold" className="size-12 mb-2 opacity-20" />
                    <p>No hay productos en esta categoría</p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </main>

        {/* Right Panel - Order Summary */}
        <aside className="w-[380px] flex flex-col bg-card border-l shadow-xl z-20">
          {/* Customer Selection */}
          <div className="p-3 border-b bg-muted/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Cliente
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-blue-600 hover:text-blue-700"
                onClick={() => setIsCustomerSearchOpen(true)}
              >
                Cambiar
              </Button>
            </div>
            <div className="flex items-center gap-3 bg-card p-2 rounded-md border shadow-sm">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <User weight="bold" className="size-5" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-medium text-sm truncate text-foreground">
                  {currentCustomer?.name || "Cliente General"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentCustomer?.email || "Venta al público"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border-b bg-muted/50">
            <div>
              <h2 className="font-bold text-lg text-foreground">
                Orden Actual
              </h2>
              <p className="text-xs text-muted-foreground">{items.length} productos</p>
            </div>
            <div className="flex gap-1">
              {heldOrders.length > 0 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsHeldOrdersOpen(true)}
                  className="relative text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                  title="Ver órdenes en espera"
                >
                  <ClockCounterClockwise weight="bold" className="size-5" />
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 text-[10px] font-bold text-white flex items-center justify-center">
                    {heldOrders.length}
                  </span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleHoldOrder}
                disabled={items.length === 0}
                className="text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Poner en espera"
              >
                <Pause weight="bold" className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearOrder}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                disabled={items.length === 0}
                title="Limpiar orden"
              >
                <Trash weight="bold" className="size-5" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-3 items-start group"
                >
                  <div className="flex flex-col gap-1 items-center justify-center bg-muted rounded-md w-8 py-1">
                    <button
                      onClick={() => incrementItem(item.productId)}
                      className="text-muted-foreground hover:text-foreground p-0.5"
                    >
                      <Plus weight="bold" className="size-3" />
                    </button>
                    <span className="text-sm font-bold">{item.quantity}</span>
                    <button
                      onClick={() => decrementItem(item.productId)}
                      className="text-muted-foreground hover:text-foreground p-0.5"
                    >
                      <Minus weight="bold" className="size-3" />
                    </button>
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-sm text-foreground">
                        {item.name}
                      </span>
                      <span className="font-bold text-sm">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {formatCurrency(item.price)} c/u
                    </div>
                  </div>

                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X weight="bold" className="size-4" />
                  </button>
                </div>
              ))}

              {items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                  <Coffee weight="duotone" className="size-10 mb-2 opacity-20" />
                  <p className="text-sm">La orden está vacía</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 bg-muted border-t space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Impuestos (IVA)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-end">
                <span className="font-bold text-lg text-foreground">
                  Total
                </span>
                <span className="font-bold text-2xl text-foreground">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <Button
              className="w-full h-14 text-lg font-bold bg-foreground hover:bg-foreground/90 text-background shadow-lg shadow-foreground/20"
              disabled={items.length === 0 || isSubmitting}
              onClick={() => setIsPaymentDialogOpen(true)}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Procesando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CreditCard weight="bold" className="size-6" />
                  <span>PAGAR {formatCurrency(total)}</span>
                </div>
              )}
            </Button>
          </div>
        </aside>
      </div>

      <PaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        total={total}
        onConfirm={handlePaymentConfirm}
        isSubmitting={isSubmitting}
      />

      {/* Customer Selection Dialog */}
      <Dialog
        open={isCustomerSearchOpen}
        onOpenChange={setIsCustomerSearchOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Seleccionar Cliente</DialogTitle>
            <DialogDescription>
              Busca un cliente por nombre o selecciona uno de la lista.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <MagnifyingGlass weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                className="pl-9"
                // Simple filter implementation could go here if needed,
                // but for now we rely on the list
              />
            </div>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setCustomerId("");
                    setIsCustomerSearchOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent text-left transition-colors border border-transparent hover:border-border"
                >
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <User weight="bold" className="size-6" />
                  </div>
                  <div>
                    <p className="font-medium">Cliente General</p>
                    <p className="text-xs text-muted-foreground">
                      Venta al público
                    </p>
                  </div>
                </button>
                {customers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => {
                      setCustomerId(customer.id);
                      setIsCustomerSearchOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent text-left transition-colors border border-transparent hover:border-border",
                      customerId === customer.id &&
                        "bg-muted border-border"
                    )}
                  >
                    <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      {customer.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-medium truncate">{customer.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {customer.email}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Held Orders Dialog */}
      <Dialog open={isHeldOrdersOpen} onOpenChange={setIsHeldOrdersOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Órdenes en Espera</DialogTitle>
            <DialogDescription>
              Selecciona una orden para retomarla.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="grid gap-4">
              {heldOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No hay órdenes en espera.
                </div>
              ) : (
                heldOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">
                        {order.customerName || "Cliente General"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(
                          new Date(order.createdAt),
                          "d MMM yyyy, h:mm a",
                          { locale: es }
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.items.length} productos
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold">
                        {/* Calculate total for display if needed, or just show items count */}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => {
                          resumeHeldOrder(order);
                          setIsHeldOrdersOpen(false);
                        }}
                      >
                        Retomar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
