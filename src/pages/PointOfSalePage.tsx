import { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trash,
  User,
  ArrowCounterClockwise,
  Pause,
  CreditCard,
  Package,
  Question,
  UserPlus,
  UserMinus,
  ClockCounterClockwise,
  CaretUp,
  CaretDown,
} from "@phosphor-icons/react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageTransition } from "@/components/motion/PageTransition";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/Spinner";
import { CustomerFormDialog } from "@/components/customers/CustomerFormDialog";
import { PaymentDialog } from "@/components/sales/PaymentDialog";
import { HeldOrdersPanel } from "@/components/sales/HeldOrdersPanel";
import { ProductAutoComplete } from "@/components/products/ProductAutoComplete";
import { OrderProductTablePos } from "@/components/sales/OrderProductTablePos";
import { KeyboardShortcutsModal } from "@/components/keyboard/KeyboardShortcutsModal";
import { KeyPressIndicator } from "@/components/keyboard/KeyPressIndicator";
import { ShortcutBadge } from "@/components/keyboard/ShortcutBadge";
import { usePointOfSale } from "@/hooks/usePointOfSale";
import { toast } from "sonner";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { PAGE_LAYOUT_CLASS } from "@/lib/constants";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useKeyPressIndicator } from "@/hooks/useKeyPressIndicator";
import type { ProductDto } from "@/api/productsApi";
import type { CustomerDto } from "@/api/customersApi";
import { type PaymentMethodType } from "@/api/salesApi";
import { cn } from "@/lib/utils";

type MobileSummarySnap = "collapsed" | "mid" | "full";

export function PointOfSalePage() {
  useDocumentTitle("Punto de Venta");
  const navigate = useNavigate();

  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
  const [isHeldOrdersPanelOpen, setIsHeldOrdersPanelOpen] = useState(false);
  const [isGenericCustomer, setIsGenericCustomer] = useState(false);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [selectedCustomerIndex, setSelectedCustomerIndex] = useState(-1);
  const [customerToEdit, setCustomerToEdit] = useState<CustomerDto | null>(
    null
  );
  const [mobileSummarySnap, setMobileSummarySnap] =
    useState<MobileSummarySnap>("collapsed");

  // Referencias para elementos enfocables
  const customerSearchInputRef = useRef<HTMLInputElement>(null);
  const discountInputRef = useRef<HTMLInputElement>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const mobileSheetGestureRef = useRef<{
    startY: number;
    startTime: number;
  } | null>(null);

  // Hook para indicadores visuales
  const { recentKeyPress, triggerIndicator } = useKeyPressIndicator();

  const {
    items,
    customers,
    customersLoading,
    customerId,
    setCustomerId,
    customerSearchTerm,
    setCustomerSearchTerm,
    filteredCustomers,
    searchTerm,
    setSearchTerm,
    searchResults,
    searchError,
    isSearchLoading,
    isLookupPending,
    addProductToOrder,
    addProductByLookup,
    incrementItem,
    decrementItem,
    removeItem,
    clearOrder,
    holdOrder,
    resumeHeldOrder,
    removeHeldOrder,
    heldOrders,
    heldOrdersLoading,
    subtotal,
    discount,
    setDiscount,
    appliedDiscount,
    taxAmount,
    taxRate,
    total,
    submitSale,
    isSubmitting,
    reloadCustomers,
    updateItemPrice,
  } = usePointOfSale({
    onSaleCreated: (sale) => {
      toast.success("Venta registrada", {
        description: `Folio #${sale.saleNumber} guardado correctamente`,
      });
    },
    // Punto de Venta: no aplicar impuestos al total
    includeTax: false,
  });

  // Effect para hacer scroll al elemento seleccionado en el dropdown de clientes
  useEffect(() => {
    if (
      selectedCustomerIndex >= 0 &&
      customerDropdownRef.current &&
      customerSearchOpen
    ) {
      const buttons = customerDropdownRef.current.querySelectorAll("button");
      const selectedButton = buttons[selectedCustomerIndex];
      if (selectedButton) {
        selectedButton.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [selectedCustomerIndex, customerSearchOpen]);

  // Effect para cargar productos de venta repetida
  useEffect(() => {
    const repeatSaleItems = localStorage.getItem("repeatSaleItems");
    if (repeatSaleItems) {
      try {
        const items = JSON.parse(repeatSaleItems);
        // Agregar cada producto al carrito
        items.forEach(
          (item: {
            productId: string;
            productName: string;
            quantity: number;
            price: number;
          }) => {
            const product: ProductDto = {
              id: item.productId,
              name: item.productName,
              description: null,
              sku: "",
              barcode: "",
              brand: "",
              category: "",
              price: item.price,
              cost: 0,
              stock: item.quantity,
              reservedStock: 0,
              isActive: true,
            };
            // Agregar la cantidad especificada
            for (let i = 0; i < item.quantity; i++) {
              addProductToOrder(product);
            }
          }
        );

        toast.success("Venta repetida", {
          description: `${items.length} productos cargados desde la venta anterior`,
        });

        // Limpiar después de cargar
        localStorage.removeItem("repeatSaleItems");
      } catch (error) {
        console.error("Error al cargar productos de venta repetida:", error);
      }
    }
  }, [addProductToOrder]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
      }),
    []
  );

  const formatCurrency = (value: number) => currencyFormatter.format(value);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === customerId) ?? null,
    [customers, customerId]
  );

  const isMobileSummaryExpanded = mobileSummarySnap !== "collapsed";

  const getNextSnapUp = (current: MobileSummarySnap): MobileSummarySnap => {
    if (current === "collapsed") return "mid";
    if (current === "mid") return "full";
    return "full";
  };

  const getNextSnapDown = (
    current: MobileSummarySnap
  ): MobileSummarySnap => {
    if (current === "full") return "mid";
    if (current === "mid") return "collapsed";
    return "collapsed";
  };

  const handleMobileSheetTouchStart = (
    event: React.TouchEvent<HTMLDivElement>
  ) => {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    mobileSheetGestureRef.current = {
      startY: touch.clientY,
      startTime: Date.now(),
    };
  };

  const handleMobileSheetTouchEnd = (
    event: React.TouchEvent<HTMLDivElement>
  ) => {
    const gesture = mobileSheetGestureRef.current;
    const touch = event.changedTouches[0];

    if (!gesture || !touch) {
      return;
    }

    const deltaY = touch.clientY - gesture.startY;
    const elapsed = Math.max(Date.now() - gesture.startTime, 1);
    const speed = Math.abs(deltaY) / elapsed;

    const isSwipeUp = deltaY <= -36 || (deltaY < 0 && speed >= 0.55);
    const isSwipeDown = deltaY >= 36 || (deltaY > 0 && speed >= 0.55);

    if (isSwipeUp) {
      setMobileSummarySnap((current) => getNextSnapUp(current));
    } else if (isSwipeDown) {
      setMobileSummarySnap((current) => getNextSnapDown(current));
    }

    mobileSheetGestureRef.current = null;
  };

  const mobileSummarySnapClass =
    mobileSummarySnap === "full"
      ? "translate-y-0"
      : mobileSummarySnap === "mid"
        ? "translate-y-[calc(100%-22rem)]"
        : "translate-y-[calc(100%-4.25rem)]";

  const handleLookupSubmit = async () => {
    const code = searchTerm.trim();
    if (!code || isLookupPending) {
      return;
    }
    const product = await addProductByLookup(code);
    if (!product) {
      toast.error("Producto no encontrado", {
        description: "Verifica el código de barras o la búsqueda.",
      });
      return;
    }

    toast.success("Producto agregado", {
      description: `${product.name} añadido a la orden`,
    });
  };

  const handleSelectProduct = (product: ProductDto) => {
    addProductToOrder(product);
    toast.success("Producto agregado", {
      description: `${product.name} añadido a la orden`,
    });
    setSearchTerm("");
  };

  const handleHold = async () => {
    try {
      await holdOrder();
      toast.success("Orden guardada", {
        description: "La orden se guardó correctamente en el servidor",
      });
    } catch {
      toast.error("Error al guardar", {
        description: "No se pudo guardar la orden en espera",
      });
    }
  };

  const handleClear = () => {
    clearOrder();
    toast.success("Orden vaciada", {
      description: "El carrito se limpió correctamente",
    });
  };

  const handleCharge = () => {
    setMobileSummarySnap("collapsed");
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentConfirm = async (
    paymentMethod: PaymentMethodType,
    amountReceived: number,
    reference: string
  ) => {
    await submitSale(paymentMethod, amountReceived, reference);
  };

  const handleDiscountChange = (value: string) => {
    if (!value) {
      setDiscount(0);
      return;
    }
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
      setDiscount(numeric);
    }
  };

  const handleCustomerDialogClose = async (saved: boolean) => {
    setIsCustomerDialogOpen(false);
    if (saved) {
      await reloadCustomers();
      toast.success("Cliente creado", {
        description: "El nuevo cliente ha sido agregado",
      });
    }
  };

  const handleSelectCustomer = (customerId: string) => {
    setCustomerId(customerId);
    setCustomerSearchTerm("");
    setCustomerSearchOpen(false);
    setIsGenericCustomer(false);
    setSelectedCustomerIndex(-1);
  };

  const handleRemoveCustomer = () => {
    setCustomerId("");
    setCustomerSearchTerm("");
    setIsGenericCustomer(false);
    setCustomerSearchOpen(false);
    setSelectedCustomerIndex(-1);
    toast.success("Cliente removido", {
      description: "Puedes seleccionar otro cliente o usar venta rápida",
    });
  };

  const handleCustomerSearchKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (!customerSearchOpen || filteredCustomers.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedCustomerIndex((prev) =>
          prev < filteredCustomers.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedCustomerIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCustomers.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedCustomerIndex >= 0) {
          handleSelectCustomer(filteredCustomers[selectedCustomerIndex].id);
        }
        break;
      case "Escape":
        e.preventDefault();
        setCustomerSearchOpen(false);
        setSelectedCustomerIndex(-1);
        break;
    }
  };

  // Configurar atajos de teclado globales
  const { allShortcuts } = useKeyboardShortcuts([
    {
      key: "F1",
      label: "F1",
      description: "Mostrar ayuda de atajos",
      handler: () => {
        triggerIndicator("F1");
        setIsShortcutsHelpOpen(true);
      },
    },
    {
      key: "F2",
      label: "F2",
      description: "Focus en búsqueda de productos",
      handler: () => {
        triggerIndicator("F2");
        // Enfocar el elemento de búsqueda de productos
        const searchInput = document.querySelector(
          'input[placeholder*="Escanea"]'
        ) as HTMLInputElement;
        searchInput?.focus();
      },
    },
    {
      key: "F3",
      label: "F3",
      description: "Buscar/Crear cliente",
      handler: () => {
        triggerIndicator("F3");
        customerSearchInputRef.current?.focus();
        customerSearchInputRef.current?.select();
      },
    },
    {
      key: "F4",
      label: "F4",
      description: "Aplicar descuento",
      handler: () => {
        triggerIndicator("F4");
        discountInputRef.current?.focus();
        discountInputRef.current?.select();
      },
    },
    {
      key: "F5",
      label: "F5",
      description: "Ver historial de ventas",
      handler: () => {
        triggerIndicator("F5");
        navigate("/sales");
      },
    },
    {
      key: "F8",
      label: "F8",
      description: "Poner orden en espera",
      enabled: items.length > 0,
      handler: () => {
        triggerIndicator("F8");
        void handleHold();
      },
    },
    {
      key: "F9",
      label: "F9",
      description: "Proceder a cobrar",
      enabled: items.length > 0 && (customerId !== "" || isGenericCustomer),
      handler: () => {
        triggerIndicator("F9");
        handleCharge();
      },
    },
    {
      key: "F12",
      label: "F12",
      description: "Abrir cajón",
      handler: () => {
        triggerIndicator("F12");
        // TODO: Implementar apertura de cajón si hay hardware disponible
        toast.success("Cajón", {
          description: "Funcionalidad de apertura de cajón en desarrollo",
        });
      },
    },
    {
      key: "Escape",
      label: "ESC",
      description: "Cancelar/Limpiar orden actual",
      enabled: items.length > 0,
      handler: () => {
        triggerIndicator("ESC");
        handleClear();
      },
    },
    {
      key: "Ctrl+N",
      label: "Ctrl+N",
      description: "Nueva venta",
      enabled: items.length > 0,
      handler: () => {
        triggerIndicator("Ctrl+N");
        handleClear();
      },
    },
    {
      key: "Ctrl+H",
      label: "Ctrl+H",
      description: "Ver historial",
      handler: () => {
        triggerIndicator("Ctrl+H");
        // TODO: Navegar a historial de ventas
        toast.success("Historial", {
          description: "Navegando a historial de ventas...",
        });
      },
    },
  ]);

  return (
    <PageTransition>
      <KeyPressIndicator
        show={!!recentKeyPress}
        keyLabel={recentKeyPress?.key || ""}
      />

      <DashboardLayout
        breadcrumbs={[
          { label: "Panel principal", href: "/dashboard" },
          { label: "Punto de Venta" },
        ]}
        className={PAGE_LAYOUT_CLASS}
      >
        <div className="flex min-h-dvh w-full flex-col overflow-y-auto overflow-x-hidden pb-24 md:h-screen md:overflow-hidden md:pb-0">
          <div className="flex flex-wrap items-center justify-end gap-2 md:flex-nowrap">
            {heldOrders.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMobileSummarySnap("collapsed");
                  setIsHeldOrdersPanelOpen(true);
                }}
                className="relative gap-2"
              >
                <Pause size={16} weight="bold" />
                <span className="text-xs">Órdenes</span>
                <Badge variant="default" className="ml-1">
                  {heldOrders.length}
                </Badge>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/sales")}
              className="gap-2"
            >
              <ClockCounterClockwise className="size-4" weight="bold" />
              <span className="text-xs">F5</span>
              <span className="hidden sm:inline text-xs">- Historial</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsShortcutsHelpOpen(true)}
              className="gap-2"
            >
              <Question className="size-4" weight="bold" />
              <span className="text-xs">F1</span>
              <span className="hidden sm:inline text-xs">- Atajos</span>
            </Button>
          </div>

          <div className="flex flex-1 flex-col gap-6 md:flex-row md:overflow-hidden">
            <div className="flex min-h-0 flex-1 flex-col gap-6 pb-28 md:pb-0">
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle>Punto de Venta</CardTitle>
                  <CardDescription>
                    Escanea un código o busca por nombre para agregar productos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Label htmlFor="pos-search">
                        Búsqueda rápida con autocompletado
                      </Label>
                      <ShortcutBadge shortcut="F2" variant="outline" />
                    </div>
                    <ProductAutoComplete
                      value={searchTerm}
                      onChange={setSearchTerm}
                      results={searchResults}
                      onSelect={handleSelectProduct}
                      onSubmit={handleLookupSubmit}
                      isLoading={isSearchLoading}
                      isSubmitting={isLookupPending}
                      error={searchError}
                      placeholder="Escanea código o busca por nombre"
                      formatCurrency={formatCurrency}
                      showSubmitButton={true}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle>Orden actual</CardTitle>
                  <CardDescription>
                    Administra los productos del ticket
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {items.length === 0 ? (
                    <div className="flex min-h-[190px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12 text-center">
                      <Package
                        className="size-10 text-muted-foreground"
                        weight="duotone"
                      />
                      <div>
                        <p className="font-semibold">Tu ticket está vacío</p>
                        <p className="text-sm text-muted-foreground">
                          Escanea un código o busca un producto para comenzar
                        </p>
                      </div>
                    </div>
                  ) : (
                    <OrderProductTablePos
                      items={items.map((item) => ({
                        productId: item.productId,
                        name: item.name,
                        sku: item.sku,
                        quantity: item.quantity,
                        price: item.price,
                        stock: item.stock,
                      }))}
                      onIncrement={incrementItem}
                      onDecrement={decrementItem}
                      onRemoveItem={removeItem}
                      onQuantityChange={(
                        productId: string,
                        quantity: number
                      ) => {
                        const item = items.find(
                          (i) => i.productId === productId
                        );
                        if (item) {
                          const difference = quantity - item.quantity;
                          if (difference > 0) {
                            for (let i = 0; i < difference; i++) {
                              incrementItem(productId);
                            }
                          } else {
                            for (let i = 0; i < -difference; i++) {
                              decrementItem(productId);
                            }
                          }
                        }
                      }}
                      onPriceChange={updateItemPrice}
                      formatCurrency={formatCurrency}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            <aside
              className={cn(
                "z-30 flex w-full flex-col border-t bg-background shadow-xl md:z-10 md:w-[400px] md:min-w-[400px] md:border-t-0 md:border-l md:shadow-none",
                "fixed inset-x-0 bottom-0 h-[82dvh] rounded-t-2xl transition-transform duration-500 ease-out will-change-transform md:static md:h-full md:max-h-full md:rounded-none md:translate-y-0",
                mobileSummarySnapClass
              )}
            >
              <div
                className="flex h-[72px] items-center gap-2 border-b px-4 md:hidden"
                onTouchStart={handleMobileSheetTouchStart}
                onTouchEnd={handleMobileSheetTouchEnd}
              >
                <button
                  type="button"
                  className="relative flex min-w-0 flex-1 items-center justify-between text-left"
                  onClick={() =>
                    setMobileSummarySnap((prev) => {
                      if (prev === "full") return "collapsed";
                      return getNextSnapUp(prev);
                    })
                  }
                  aria-label="Cambiar nivel del panel de resumen"
                  title="Cambiar nivel del panel"
                >
                  <div className="absolute left-1/2 top-[-0.35rem] h-1.5 w-12 -translate-x-1/2 rounded-full bg-muted-foreground/30" />
                  <div className="pt-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Resumen
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {items.length} productos
                    </p>
                  </div>
                  <div className="pt-2 text-right">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Total
                    </p>
                    <p className="text-base font-bold text-foreground">
                      {formatCurrency(total)}
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    className="h-8 gap-1 px-2"
                    onClick={handleCharge}
                    disabled={
                      isSubmitting ||
                      items.length === 0 ||
                      (!customerId && !isGenericCustomer)
                    }
                    aria-label="Cobrar venta"
                    title="Cobrar venta"
                  >
                    <CreditCard className="size-3.5" weight="bold" />
                    <span className="text-[11px] font-semibold">Cobrar</span>
                  </Button>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground hover:text-foreground disabled:opacity-40"
                    onClick={() =>
                      setMobileSummarySnap((prev) => getNextSnapDown(prev))
                    }
                    disabled={mobileSummarySnap === "collapsed"}
                    aria-label="Bajar panel"
                    title="Bajar panel"
                  >
                    <CaretDown weight="bold" className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground hover:text-foreground disabled:opacity-40"
                    onClick={() =>
                      setMobileSummarySnap((prev) => getNextSnapUp(prev))
                    }
                    disabled={mobileSummarySnap === "full"}
                    aria-label="Subir panel"
                    title="Subir panel"
                  >
                    <CaretUp weight="bold" className="size-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:flex md:min-h-0 md:flex-col md:space-y-3 md:overflow-hidden md:p-3">
                <Card className="shadow-sm md:flex md:min-h-0 md:flex-1 md:flex-col">
                  <CardHeader className="pb-2 md:px-4 md:pt-4">
                    <CardTitle>Cliente</CardTitle>
                    <CardDescription>
                      Busca, crea o vende sin cliente identificado
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 md:flex md:min-h-0 md:flex-1 md:flex-col md:px-4 md:pb-4">
                    <div className="relative space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Buscar cliente</Label>
                        <ShortcutBadge shortcut="F3" variant="outline" />
                      </div>
                      <div className="flex gap-2">
                        <Input
                          ref={customerSearchInputRef}
                          value={customerSearchTerm}
                          onChange={(e) => {
                            setCustomerSearchTerm(e.target.value);
                            setSelectedCustomerIndex(-1);
                          }}
                          onKeyDown={handleCustomerSearchKeyDown}
                          placeholder="Nombre, email o teléfono"
                          className="flex-1"
                          onFocus={() => setCustomerSearchOpen(true)}
                          onBlur={() => {
                            setTimeout(() => setCustomerSearchOpen(false), 200);
                          }}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setCustomerToEdit(null);
                            setMobileSummarySnap("collapsed");
                            setIsCustomerDialogOpen(true);
                          }}
                          aria-label="Crear nuevo cliente"
                          title="Crear nuevo cliente"
                        >
                          <UserPlus className="size-4" weight="bold" />
                        </Button>
                      </div>

                      {customerSearchOpen && customerSearchTerm.trim() && (
                        <div
                          ref={customerDropdownRef}
                          className="absolute left-0 top-full z-50 mt-1 w-full animate-in zoom-in-95 rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none fade-in-0"
                        >
                          {filteredCustomers.length === 0 ? (
                            <div className="p-4 text-center">
                              <p className="mb-3 text-sm text-muted-foreground">
                                No se encontraron clientes
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCustomerToEdit(null);
                                  setMobileSummarySnap("collapsed");
                                  setIsCustomerDialogOpen(true);
                                  setCustomerSearchOpen(false);
                                }}
                                className="w-full"
                              >
                                <UserPlus
                                  className="mr-2 size-4"
                                  weight="bold"
                                />
                                Crear nuevo cliente
                              </Button>
                            </div>
                          ) : (
                            <div className="max-h-[200px] overflow-y-auto p-1">
                              {filteredCustomers.map((customer, index) => (
                                <button
                                  key={customer.id}
                                  type="button"
                                  onClick={() =>
                                    handleSelectCustomer(customer.id)
                                  }
                                  onMouseEnter={() =>
                                    setSelectedCustomerIndex(index)
                                  }
                                  className={cn(
                                    "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                                    selectedCustomerIndex === index
                                      ? "bg-accent text-accent-foreground"
                                      : "hover:bg-accent hover:text-accent-foreground"
                                  )}
                                >
                                  <Avatar className="mr-2 h-8 w-8">
                                    <AvatarFallback className="text-xs">
                                      {customer.name.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-1 flex-col items-start overflow-hidden">
                                    <span className="w-full truncate text-left font-medium">
                                      {customer.name}
                                    </span>
                                    <div className="flex w-full items-center gap-2 text-xs text-muted-foreground">
                                      <span className="truncate">
                                        {customer.email}
                                      </span>
                                      {customer.phone && (
                                        <>
                                          <span>•</span>
                                          <span className="truncate">
                                            {customer.phone}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 md:min-h-0 md:flex-1 md:overflow-y-auto md:pr-1">
                      <Button
                        variant={isGenericCustomer ? "default" : "outline"}
                        className="w-full justify-center md:h-10"
                        onClick={() => {
                          setIsGenericCustomer(!isGenericCustomer);
                          if (!isGenericCustomer) {
                            setCustomerId("");
                            setCustomerSearchTerm("");
                            setCustomerSearchOpen(false);
                          }
                        }}
                      >
                        <User className="mr-2 size-4" weight="bold" />
                        {isGenericCustomer
                          ? "Cliente genérico seleccionado"
                          : "Venta rápida sin cliente"}
                      </Button>

                      {isGenericCustomer ? (
                        <div className="rounded-lg border border-dashed bg-muted/30 p-3 text-center md:p-3">
                          <User
                            className="mx-auto mb-2 size-7 text-muted-foreground"
                            weight="duotone"
                          />
                          <p className="text-sm font-medium text-muted-foreground">
                            Cliente genérico/Sin cliente
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Venta rápida sin identificación
                          </p>
                        </div>
                      ) : selectedCustomer ? (
                        <div className="space-y-2">
                          <div className="rounded-xl border bg-card/70 p-3 shadow-sm">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-11 w-11 border">
                                <AvatarFallback className="text-sm font-semibold">
                                  {selectedCustomer.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1 space-y-1">
                                <p className="truncate text-sm font-semibold text-foreground">
                                  {selectedCustomer.name}
                                </p>
                                {selectedCustomer.email && (
                                  <p className="truncate text-xs text-muted-foreground">
                                    {selectedCustomer.email}
                                  </p>
                                )}
                                {selectedCustomer.phone && (
                                  <p className="truncate text-xs text-muted-foreground">
                                    {selectedCustomer.phone}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9"
                                onClick={() => {
                                  setCustomerToEdit(selectedCustomer);
                                  setMobileSummarySnap("collapsed");
                                  setIsCustomerDialogOpen(true);
                                }}
                              >
                                <UserPlus className="mr-2 size-4" weight="bold" />
                                Editar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9"
                                onClick={handleRemoveCustomer}
                              >
                                <UserMinus className="mr-2 size-4" weight="bold" />
                                Cambiar
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed bg-muted/30 p-3 text-center md:p-3">
                          <User
                            className="mx-auto mb-2 size-7 text-muted-foreground"
                            weight="duotone"
                          />
                          <p className="text-sm font-medium text-muted-foreground">
                            Sin cliente seleccionado
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Busca o crea un cliente para continuar
                          </p>
                        </div>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full md:h-9"
                        onClick={() => {
                          void reloadCustomers();
                        }}
                        disabled={customersLoading}
                      >
                        <ArrowCounterClockwise
                          className="mr-2 size-4"
                          weight="bold"
                        />
                        Actualizar clientes
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/10 bg-linear-to-br from-background via-background to-primary/5 shadow-sm">
                  <CardHeader className="pb-2 md:px-4 md:pt-4">
                    <CardTitle>Resumen</CardTitle>
                    <CardDescription>
                      Totales calculados en tiempo real
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 md:px-4 md:pb-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border bg-card/80 p-2.5 md:p-2.5">
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          Subtotal
                        </p>
                        <p className="mt-1 text-base font-semibold tracking-tight md:text-lg">
                          {formatCurrency(subtotal)}
                        </p>
                      </div>
                      <div className="rounded-xl border bg-card/80 p-2.5 md:p-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                              Descuento
                            </p>
                            <p className="mt-1 text-base font-semibold tracking-tight md:text-lg">
                              {formatCurrency(appliedDiscount)}
                            </p>
                          </div>
                          <ShortcutBadge shortcut="F4" variant="outline" />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 text-sm">
                      <Label htmlFor="pos-discount" className="text-muted-foreground">
                        Ajuste manual
                      </Label>
                      <Input
                        id="pos-discount"
                        ref={discountInputRef}
                        type="number"
                        min="0"
                        step="0.01"
                        value={discount === 0 ? "" : discount.toString()}
                        onChange={(event) =>
                          handleDiscountChange(event.target.value)
                        }
                        placeholder="0.00"
                        className="h-9"
                      />
                    </div>
                    {taxRate > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Impuesto ({(taxRate * 100).toFixed(2)}%)
                        </span>
                        <span className="font-semibold">
                          {formatCurrency(taxAmount)}
                        </span>
                      </div>
                    )}
                    <Separator className="my-1" />
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/10 bg-primary/5 px-3 py-2.5 md:px-4 md:py-3">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total a cobrar
                        </p>
                        <p className="text-2xl font-black tracking-tight md:text-3xl">
                          {formatCurrency(total)}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {items.length} producto{items.length === 1 ? "" : "s"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm md:mt-auto">
                  <CardContent className="space-y-3 pt-5 md:px-4 md:pb-4 md:pt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="group relative h-10 px-3 text-sm"
                        onClick={handleHold}
                        disabled={items.length === 0}
                        title="F8 para poner en espera"
                      >
                        <Pause className="size-4" weight="bold" />
                        Poner en espera
                        <ShortcutBadge
                          shortcut="F8"
                          variant="outline"
                          className="absolute right-2 opacity-0 transition-opacity group-hover:opacity-100"
                        />
                      </Button>
                      <Button
                        variant="outline"
                        className="group relative h-10 px-3 text-sm"
                        onClick={handleClear}
                        disabled={items.length === 0}
                        title="ESC para limpiar"
                      >
                        <Trash className="size-4" weight="bold" />
                        Limpiar
                        <ShortcutBadge
                          shortcut="ESC"
                          variant="outline"
                          className="absolute right-2 opacity-0 transition-opacity group-hover:opacity-100"
                        />
                      </Button>
                    </div>
                    <Button
                      className="group relative h-11 w-full text-base"
                      size="lg"
                      onClick={handleCharge}
                      disabled={
                        isSubmitting ||
                        items.length === 0 ||
                        (!customerId && !isGenericCustomer)
                      }
                      title="F9 para proceder al pago"
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner size="sm" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <CreditCard className="size-5" weight="bold" />
                          Cobrar {formatCurrency(total)}
                          <ShortcutBadge
                            shortcut="F9"
                            className="absolute right-2 opacity-0 transition-opacity group-hover:opacity-100"
                          />
                        </>
                      )}
                    </Button>
                    {!customerId && !isGenericCustomer && (
                      <p className="text-center text-sm text-destructive">
                        Selecciona un cliente o usa la venta rápida para
                        habilitar el cobro
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </aside>
          </div>

          {isMobileSummaryExpanded && (
            <button
              type="button"
              className="fixed inset-0 z-20 bg-black/35 md:hidden"
              onClick={() => setMobileSummarySnap("collapsed")}
              aria-label="Cerrar panel de resumen"
              title="Cerrar panel"
            />
          )}
        </div>
      </DashboardLayout>
      <HeldOrdersPanel
        open={isHeldOrdersPanelOpen}
        onOpenChange={setIsHeldOrdersPanelOpen}
        orders={heldOrders}
        loading={heldOrdersLoading}
        onResume={(order) => {
          resumeHeldOrder(order);
          toast.success("Orden recuperada", {
            description: "Continuemos con el cobro",
          });
        }}
        onDelete={async (orderId) => {
          try {
            await removeHeldOrder(orderId);
            toast.success("Orden eliminada", {
              description: "La orden en espera fue eliminada",
            });
          } catch {
            toast.error("Error", {
              description: "No se pudo eliminar la orden",
            });
          }
        }}
        formatCurrency={formatCurrency}
      />
      <CustomerFormDialog
        open={isCustomerDialogOpen}
        customer={customerToEdit}
        onClose={handleCustomerDialogClose}
      />
      <PaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        total={total}
        onConfirm={handlePaymentConfirm}
        isSubmitting={isSubmitting}
      />
      <KeyboardShortcutsModal
        open={isShortcutsHelpOpen}
        onOpenChange={setIsShortcutsHelpOpen}
        shortcuts={allShortcuts}
      />
    </PageTransition>
  );
}
