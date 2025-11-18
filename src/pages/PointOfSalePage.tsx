import { useMemo, useState } from "react";
import {
  IconMinus,
  IconPlus,
  IconTrash,
  IconUser,
  IconRefresh,
  IconPlayerPause,
  IconPlayerPlay,
  IconCreditCardPay,
  IconPackage,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/Spinner";
import { CustomerFormDialog } from "@/components/customers/CustomerFormDialog";
import { PaymentDialog } from "@/components/sales/PaymentDialog";
import { ProductAutoComplete } from "@/components/products/ProductAutoComplete";
import { usePointOfSale } from "@/hooks/usePointOfSale";
import { useToast } from "@/hooks/use-toast";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import type { ProductDto } from "@/api/productsApi";
import { type PaymentMethodType } from "@/api/salesApi";

function formatSku(sku?: string) {
  return sku ? sku.toUpperCase() : "—";
}

export function PointOfSalePage() {
  useDocumentTitle("Punto de Venta");
  const { toast } = useToast();

  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

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
    hasHeldOrder,
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

  const handleHold = () => {
    holdOrder();
    toast({
      title: "Orden en espera",
      description: "Puedes reanudarla cuando lo necesites",
    });
  };

  const handleResume = () => {
    resumeHeldOrder();
    toast({
      title: "Orden restaurada",
      description: "Continuemos con el cobro",
    });
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

  const handleCreateCustomer = () => {
    setIsCustomerDialogOpen(true);
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

  return (
    <PageTransition>
      <DashboardLayout
        breadcrumbs={[
          { label: "Panel principal", href: "/dashboard" },
          { label: "Punto de Venta" },
        ]}
        className="flex flex-1 flex-col gap-6 p-4"
      >
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
                  <Label htmlFor="pos-search">
                    Búsqueda rápida con autocompletado
                  </Label>
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
                  <div className="rounded-xl border">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-center">
                            Cantidad
                          </TableHead>
                          <TableHead className="text-right">Precio</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="w-14" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.productId} className="align-top">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="bg-primary/10 text-primary">
                                  <AvatarFallback>
                                    {item.name.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold leading-tight">
                                    {item.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    SKU {formatSku(item.sku)}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  onClick={() => decrementItem(item.productId)}
                                >
                                  <IconMinus className="size-4" />
                                </Button>
                                <span className="w-8 text-center font-semibold">
                                  {item.quantity}
                                </span>
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  onClick={() => incrementItem(item.productId)}
                                  disabled={
                                    item.stock > 0 &&
                                    item.quantity >= item.stock
                                  }
                                >
                                  <IconPlus className="size-4" />
                                </Button>
                              </div>
                              {item.stock > 0 &&
                                item.quantity >= item.stock && (
                                  <p className="text-center text-xs text-orange-500">
                                    Stock máximo alcanzado
                                  </p>
                                )}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.price)}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(item.price * item.quantity)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-destructive"
                                onClick={() => removeItem(item.productId)}
                              >
                                <IconTrash className="size-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle>Cliente</CardTitle>
                <CardDescription>
                  Busca o crea un cliente para la venta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-search">Buscar cliente</Label>
                  <div className="flex gap-2">
                    <Input
                      id="customer-search"
                      value={customerSearchTerm}
                      onChange={(e) => setCustomerSearchTerm(e.target.value)}
                      placeholder="Nombre o email del cliente"
                    />
                    <Button variant="outline" onClick={handleCreateCustomer}>
                      <IconUser className="size-4" />
                      Nuevo
                    </Button>
                  </div>
                </div>

                {customerSearchTerm.trim() && (
                  <div className="rounded-lg border border-dashed bg-slate-50 p-3 dark:bg-slate-900/30 max-h-40 overflow-y-auto">
                    {filteredCustomers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No se encontraron clientes. Crea uno nuevo.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {filteredCustomers.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => setCustomerId(customer.id)}
                            className={`flex w-full items-center gap-3 rounded-md border border-transparent bg-white p-2 text-left shadow-sm transition hover:border-primary hover:bg-primary/5 dark:bg-slate-900 ${
                              customerId === customer.id
                                ? "border-primary bg-primary/5"
                                : ""
                            }`}
                          >
                            <Avatar className="bg-primary/10 text-primary">
                              <AvatarFallback>
                                {customer.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {customer.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {customer.email}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <IconUser className="size-4" />
                    <span>
                      {customerId
                        ? customers.find((c) => c.id === customerId)?.name
                        : "Sin cliente seleccionado"}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      void reloadCustomers();
                    }}
                    disabled={customersLoading}
                  >
                    <IconRefresh className="size-4" />
                    Actualizar
                  </Button>
                </div>
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
                    <span className="font-semibold">
                      {formatCurrency(appliedDiscount)}
                    </span>
                  </div>
                  <Input
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
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleHold}
                    disabled={items.length === 0}
                  >
                    <IconPlayerPause className="size-4" />
                    Poner en espera
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleClear}
                    disabled={items.length === 0}
                  >
                    <IconTrash className="size-4" />
                    Limpiar
                  </Button>
                </div>
                {hasHeldOrder && (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={handleResume}
                  >
                    <IconPlayerPlay className="size-4" />
                    Reanudar orden guardada
                  </Button>
                )}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCharge}
                  disabled={isSubmitting || items.length === 0 || !customerId}
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
                    </>
                  )}
                </Button>
                {!customerId && (
                  <p className="text-center text-sm text-destructive">
                    Selecciona un cliente para habilitar el cobro
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
      <CustomerFormDialog
        open={isCustomerDialogOpen}
        customer={null}
        onClose={handleCustomerDialogClose}
      />
      <PaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        total={total}
        onConfirm={handlePaymentConfirm}
        isSubmitting={isSubmitting}
      />
    </PageTransition>
  );
}
