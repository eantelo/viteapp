import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconCoffee,
  IconSearch,
  IconMenu2,
  IconUser,
  IconTrash,
  IconCreditCard,
  IconClock,
  IconPlus,
  IconMinus,
  IconX,
  IconPlayerPause,
  IconHistory,
} from "@tabler/icons-react";
import { usePointOfSale } from "@/hooks/usePointOfSale";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
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
      toast({
        title: "¡Orden completada!",
        description: `Ticket #${sale.saleNumber} generado exitosamente.`,
      });
    },
    includeTax: true,
  });

  // Load initial data
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
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos o categorías.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Clock timer
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [toast]);

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
      toast({
        title: "Orden guardada",
        description: "La orden se ha puesto en espera correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la orden.",
        variant: "destructive",
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
    <div className="flex h-screen w-full flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Header */}
      <header className="flex h-14 items-center justify-between bg-slate-900 px-4 text-slate-50 shadow-md z-10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={() => navigate("/dashboard")}
          >
            <IconMenu2 className="size-6" />
          </Button>
          <h1 className="text-lg font-semibold tracking-tight">SalesNet POS</h1>
        </div>

        <div className="flex items-center gap-6 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <IconUser className="size-4" />
            <span>{auth?.email || "Usuario"}</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span>Terminal 01</span>
          </div>
          <div className="flex items-center gap-2 font-medium text-white bg-slate-800 px-3 py-1 rounded-full">
            <IconClock className="size-4" />
            <span>
              {format(currentTime, "EEEE, d MMM | h:mm a", { locale: es })}
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Categories */}
        <aside className="w-24 flex-col items-center gap-2 border-r bg-white py-4 dark:bg-slate-900 hidden md:flex overflow-y-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-all w-20 h-20",
                selectedCategory === category
                  ? "bg-slate-900 text-white shadow-md scale-105"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  selectedCategory === category
                    ? "bg-slate-800"
                    : "bg-slate-100 dark:bg-slate-800"
                )}
              >
                {/* Placeholder icon - ideally map categories to icons */}
                <IconCoffee className="size-6" />
              </div>
              <span className="text-[10px] font-medium text-center leading-tight line-clamp-2">
                {category}
              </span>
            </button>
          ))}
        </aside>

        {/* Main Content - Products */}
        <main className="flex-1 flex flex-col bg-slate-100/50 dark:bg-slate-950/50 relative">
          {/* Search Bar */}
          <div className="p-4 bg-white dark:bg-slate-900 border-b flex gap-3">
            <div className="relative flex-1 max-w-md">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar producto..."
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-slate-900"
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-20">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addProductToOrder(product)}
                    className="group relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md hover:border-slate-300 active:scale-95 dark:bg-slate-900 dark:border-slate-800"
                  >
                    <div className="aspect-[4/3] w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative">
                      {/* Product Image Placeholder */}
                      <IconCoffee className="size-12 text-slate-300 dark:text-slate-600" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                    </div>
                    <div className="p-3 text-left">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 text-sm leading-tight min-h-[2.5em]">
                        {product.name}
                      </h3>
                      <p className="mt-1 font-bold text-slate-700 dark:text-slate-300">
                        {formatCurrency(product.price)}
                      </p>
                    </div>
                  </button>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
                    <IconSearch className="size-12 mb-2 opacity-20" />
                    <p>No hay productos en esta categoría</p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </main>

        {/* Right Panel - Order Summary */}
        <aside className="w-[380px] flex flex-col bg-white border-l shadow-xl z-20 dark:bg-slate-900 dark:border-slate-800">
          {/* Customer Selection */}
          <div className="p-3 border-b bg-slate-50/80 dark:bg-slate-900/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
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
            <div className="flex items-center gap-3 bg-white p-2 rounded-md border shadow-sm dark:bg-slate-800 dark:border-slate-700">
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 dark:bg-slate-700">
                <IconUser className="size-5" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-medium text-sm truncate text-slate-900 dark:text-slate-100">
                  {currentCustomer?.name || "Cliente General"}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {currentCustomer?.email || "Venta al público"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border-b bg-slate-50/50 dark:bg-slate-900">
            <div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">
                Orden Actual
              </h2>
              <p className="text-xs text-slate-500">{items.length} productos</p>
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
                  <IconHistory className="size-5" />
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
                className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                title="Poner en espera"
              >
                <IconPlayerPause className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearOrder}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                disabled={items.length === 0}
                title="Limpiar orden"
              >
                <IconTrash className="size-5" />
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
                  <div className="flex flex-col gap-1 items-center justify-center bg-slate-100 rounded-md w-8 py-1 dark:bg-slate-800">
                    <button
                      onClick={() => incrementItem(item.productId)}
                      className="text-slate-500 hover:text-slate-900 p-0.5"
                    >
                      <IconPlus className="size-3" />
                    </button>
                    <span className="text-sm font-bold">{item.quantity}</span>
                    <button
                      onClick={() => decrementItem(item.productId)}
                      className="text-slate-500 hover:text-slate-900 p-0.5"
                    >
                      <IconMinus className="size-3" />
                    </button>
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                        {item.name}
                      </span>
                      <span className="font-bold text-sm">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {formatCurrency(item.price)} c/u
                    </div>
                  </div>

                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <IconX className="size-4" />
                  </button>
                </div>
              ))}

              {items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed rounded-xl">
                  <IconCoffee className="size-10 mb-2 opacity-20" />
                  <p className="text-sm">La orden está vacía</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 bg-slate-50 border-t dark:bg-slate-900 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Impuestos (IVA)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-end">
                <span className="font-bold text-lg text-slate-900 dark:text-white">
                  Total
                </span>
                <span className="font-bold text-2xl text-slate-900 dark:text-white">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <Button
              className="w-full h-14 text-lg font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20"
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
                  <IconCreditCard className="size-6" />
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
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
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
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors border border-transparent hover:border-slate-200"
                >
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <IconUser className="size-6" />
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
                      "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors border border-transparent hover:border-slate-200",
                      customerId === customer.id &&
                        "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
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
