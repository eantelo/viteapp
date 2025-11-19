import { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconTrash,
  IconUser,
  IconRefresh,
  IconPlayerPause,
  IconCreditCardPay,
  IconPackage,
  IconHelp,
  IconUserPlus,
  IconUserX,
  IconHistory,
} from "@tabler/icons-react";
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
import { CustomerCard } from "@/components/customers/CustomerDetailCard";
import { PaymentDialog } from "@/components/sales/PaymentDialog";
import { HeldOrdersPanel } from "@/components/sales/HeldOrdersPanel";
import { ProductAutoComplete } from "@/components/products/ProductAutoComplete";
import { OrderProductTablePos } from "@/components/sales/OrderProductTablePos";
import { KeyboardShortcutsModal } from "@/components/keyboard/KeyboardShortcutsModal";
import { KeyPressIndicator } from "@/components/keyboard/KeyPressIndicator";
import { ShortcutBadge } from "@/components/keyboard/ShortcutBadge";
import { usePointOfSale } from "@/hooks/usePointOfSale";
import { useToast } from "@/hooks/use-toast";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useKeyPressIndicator } from "@/hooks/useKeyPressIndicator";
import type { ProductDto } from "@/api/productsApi";
import { type PaymentMethodType } from "@/api/salesApi";
import { cn } from "@/lib/utils";

export function PointOfSalePage() {
  useDocumentTitle("Punto de Venta");
  const { toast } = useToast();
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

  // Referencias para elementos enfocables
  const customerSearchInputRef = useRef<HTMLInputElement>(null);
  const discountInputRef = useRef<HTMLInputElement>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

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
  } = usePointOfSale({
    onSaleCreated: (sale) => {
      toast({
        title: "Venta registrada",
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
              stock: item.quantity,
              isActive: true,
            };
            // Agregar la cantidad especificada
            for (let i = 0; i < item.quantity; i++) {
              addProductToOrder(product);
            }
          }
        );

        toast({
          title: "Venta repetida",
          description: `${items.length} productos cargados desde la venta anterior`,
        });

        // Limpiar después de cargar
        localStorage.removeItem("repeatSaleItems");
      } catch (error) {
        console.error("Error al cargar productos de venta repetida:", error);
      }
    }
  }, [addProductToOrder, toast]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
      }),
    []
  );

  const formatCurrency = (value: number) => currencyFormatter.format(value);

  const handleLookupSubmit = async () => {
    const code = searchTerm.trim();
    if (!code || isLookupPending) {
      return;
    }
    const product = await addProductByLookup(code);
    if (!product) {
      toast({
        title: "Producto no encontrado",
        description: "Verifica el código de barras o la búsqueda.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Producto agregado",
      description: `${product.name} añadido a la orden`,
    });
  };

  const handleSelectProduct = (product: ProductDto) => {
    addProductToOrder(product);
    toast({
      title: "Producto agregado",
      description: `${product.name} añadido a la orden`,
    });
    setSearchTerm("");
  };

  const handleHold = async () => {
    try {
      await holdOrder();
      toast({
        title: "Orden guardada",
        description: "La orden se guardó correctamente en el servidor",
      });
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar la orden en espera",
        variant: "destructive",
      });
    }
  };

  const handleClear = () => {
    clearOrder();
    toast({
      title: "Orden vaciada",
      description: "El carrito se limpió correctamente",
    });
  };

  const handleCharge = () => {
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
      toast({
        title: "Cliente creado",
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
    toast({
      title: "Cliente removido",
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
        navigate("/sales/history");
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
        toast({
          title: "Cajón",
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
        toast({
          title: "Historial",
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
        className="flex flex-1 flex-col gap-6 p-4"
      >
        {/* Botón flotante para ayuda */}
        <div className="flex justify-end gap-2">
          {heldOrders.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHeldOrdersPanelOpen(true)}
              className="gap-2 relative"
            >
              <IconPlayerPause className="size-4" />
              <span className="text-xs">Órdenes en espera</span>
              <Badge variant="default" className="ml-1">
                {heldOrders.length}
              </Badge>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/sales/history")}
            className="gap-2"
          >
            <IconHistory className="size-4" />
            <span className="text-xs">F5 - Historial</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsShortcutsHelpOpen(true)}
            className="gap-2"
          >
            <IconHelp className="size-4" />
            <span className="text-xs">F1 - Atajos</span>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div className="flex flex-col gap-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle>Punto de Venta</CardTitle>
                <CardDescription>
                  Escanea un código o busca por nombre para agregar productos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
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
                  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12 text-center">
                    <IconPackage className="size-10 text-muted-foreground" />
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
                    onQuantityChange={(productId: string, quantity: number) => {
                      const item = items.find((i) => i.productId === productId);
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
                    formatCurrency={formatCurrency}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle>Cliente</CardTitle>
                <CardDescription>
                  Busca, crea o vende sin cliente identificado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Busqueda con autocomplete */}
                <div className="space-y-2 relative">
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
                        // Delay to allow button clicks to register
                        setTimeout(() => setCustomerSearchOpen(false), 200);
                      }}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setCustomerToEdit(null);
                        setIsCustomerDialogOpen(true);
                      }}
                      title="Crear nuevo cliente"
                    >
                      <IconUserPlus className="size-4" />
                    </Button>
                  </div>

                  {/* Dropdown de búsqueda */}
                  {customerSearchOpen && customerSearchTerm.trim() && (
                    <div
                      ref={customerDropdownRef}
                      className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95"
                    >
                      {filteredCustomers.length === 0 ? (
                        <div className="p-4 text-center">
                          <p className="text-sm text-muted-foreground mb-3">
                            No se encontraron clientes
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCustomerToEdit(null);
                              setIsCustomerDialogOpen(true);
                              setCustomerSearchOpen(false);
                            }}
                            className="w-full"
                          >
                            <IconUserPlus className="size-4 mr-2" />
                            Crear nuevo cliente
                          </Button>
                        </div>
                      ) : (
                        <div className="max-h-[200px] overflow-y-auto p-1">
                          {filteredCustomers.map((customer, index) => (
                            <button
                              key={customer.id}
                              type="button"
                              onClick={() => handleSelectCustomer(customer.id)}
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
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarFallback className="text-xs">
                                  {customer.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col items-start flex-1 overflow-hidden">
                                <span className="font-medium truncate w-full text-left">
                                  {customer.name}
                                </span>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground w-full">
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

                {/* Botón para cliente genérico */}
                <Button
                  variant={isGenericCustomer ? "default" : "outline"}
                  className="w-full justify-center"
                  onClick={() => {
                    setIsGenericCustomer(!isGenericCustomer);
                    if (!isGenericCustomer) {
                      setCustomerId("");
                      setCustomerSearchTerm("");
                      setCustomerSearchOpen(false);
                    }
                  }}
                >
                  <IconUser className="size-4 mr-2" />
                  {isGenericCustomer
                    ? "Cliente genérico seleccionado"
                    : "Venta rápida sin cliente"}
                </Button>

                {/* Card con información del cliente seleccionado */}
                {isGenericCustomer ? (
                  <div className="rounded-lg border border-dashed p-4 text-center bg-slate-50 dark:bg-slate-900/30">
                    <IconUser className="size-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Cliente genérico/Sin cliente
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Venta rápida sin identificación
                    </p>
                  </div>
                ) : customerId ? (
                  <div className="space-y-3">
                    {/* Mostrar card del cliente seleccionado */}
                    {customers.find((c) => c.id === customerId) && (
                      <>
                        <CustomerCard
                          customer={
                            customers.find((c) => c.id === customerId) || null
                          }
                          onViewHistory={() => {
                            toast({
                              title: "Historial",
                              description:
                                "Visualización de historial en desarrollo",
                            });
                          }}
                          onEdit={() => {
                            setCustomerToEdit(
                              customers.find((c) => c.id === customerId) || null
                            );
                            setIsCustomerDialogOpen(true);
                          }}
                          onRemove={handleRemoveCustomer}
                          formatCurrency={formatCurrency}
                          className="shadow-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={handleRemoveCustomer}
                        >
                          <IconUserX className="size-4 mr-2" />
                          Cambiar cliente
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-4 text-center bg-slate-50 dark:bg-slate-900/30">
                    <IconUser className="size-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Sin cliente seleccionado
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Busca o crea un cliente para continuar
                    </p>
                  </div>
                )}

                {/* Botón para recargar clientes */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    void reloadCustomers();
                  }}
                  disabled={customersLoading}
                >
                  <IconRefresh className="size-4 mr-2" />
                  Actualizar clientes
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle>Resumen</CardTitle>
                <CardDescription>
                  Totales calculados en tiempo real
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Descuento</span>
                    <ShortcutBadge shortcut="F4" variant="outline" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {formatCurrency(appliedDiscount)}
                    </span>
                  </div>
                  <Input
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
                <Separator className="my-3" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total a cobrar
                    </p>
                    <p className="text-3xl font-black tracking-tight">
                      {formatCurrency(total)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {items.length} producto{items.length === 1 ? "" : "s"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 group relative"
                    onClick={handleHold}
                    disabled={items.length === 0}
                    title="F8 para poner en espera"
                  >
                    <IconPlayerPause className="size-4" />
                    Poner en espera
                    <ShortcutBadge
                      shortcut="F8"
                      variant="outline"
                      className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 group relative"
                    onClick={handleClear}
                    disabled={items.length === 0}
                    title="ESC para limpiar"
                  >
                    <IconTrash className="size-4" />
                    Limpiar
                    <ShortcutBadge
                      shortcut="ESC"
                      variant="outline"
                      className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </Button>
                </div>
                <Button
                  className="w-full group relative"
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
                      <IconCreditCardPay className="size-5" />
                      Cobrar {formatCurrency(total)}
                      <ShortcutBadge
                        shortcut="F9"
                        className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </>
                  )}
                </Button>
                {!customerId && !isGenericCustomer && (
                  <p className="text-center text-sm text-destructive">
                    Selecciona un cliente o usa la venta rápida para habilitar
                    el cobro
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
      <HeldOrdersPanel
        open={isHeldOrdersPanelOpen}
        onOpenChange={setIsHeldOrdersPanelOpen}
        orders={heldOrders}
        loading={heldOrdersLoading}
        onResume={(order) => {
          resumeHeldOrder(order);
          toast({
            title: "Orden recuperada",
            description: "Continuemos con el cobro",
          });
        }}
        onDelete={async (orderId) => {
          try {
            await removeHeldOrder(orderId);
            toast({
              title: "Orden eliminada",
              description: "La orden en espera fue eliminada",
            });
          } catch (error) {
            toast({
              title: "Error",
              description: "No se pudo eliminar la orden",
              variant: "destructive",
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
