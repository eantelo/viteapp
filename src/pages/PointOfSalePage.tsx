import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  IconBarcode,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/Spinner";
import { usePointOfSale } from "@/hooks/usePointOfSale";
import { useToast } from "@/hooks/use-toast";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import type { ProductDto } from "@/api/productsApi";

function formatSku(sku?: string) {
  return sku ? sku.toUpperCase() : "—";
}

export function PointOfSalePage() {
  useDocumentTitle("Punto de Venta");
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const focusScanInput = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);
  const selectScanInput = useCallback(() => {
    const input = searchInputRef.current;
    if (input) {
      input.focus();
      input.select();
    }
  }, []);

  useEffect(() => {
    focusScanInput();
  }, [focusScanInput]);

  const {
    items,
    customers,
    customersLoading,
    customerId,
    setCustomerId,
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
      focusScanInput();
      return;
    }
    const product = await addProductByLookup(code);
    if (!product) {
      toast({
        title: "Producto no encontrado",
        description: "Verifica el código de barras o la búsqueda.",
        variant: "destructive",
      });
      selectScanInput();
      return;
    }

    toast({
      title: "Producto agregado",
      description: `${product.name} añadido a la orden`,
    });
    focusScanInput();
  };

  const handleSelectProduct = (product: ProductDto) => {
    addProductToOrder(product);
    toast({
      title: "Producto agregado",
      description: `${product.name} añadido a la orden`,
    });
    setSearchTerm("");
    focusScanInput();
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

  const handleCharge = async () => {
    try {
      await submitSale();
    } catch (error) {
      toast({
        title: "No pudimos cobrar",
        description:
          error instanceof Error ? error.message : "Intenta nuevamente",
        variant: "destructive",
      });
    }
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
                  <Label htmlFor="pos-search">Búsqueda rápida</Label>
                  <div className="flex flex-col gap-3 md:flex-row">
                    <div className="relative flex-1">
                      <IconBarcode className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="pos-search"
                        ref={searchInputRef}
                        value={searchTerm}
                        placeholder="Escanea código o busca por nombre"
                        onChange={(event) => setSearchTerm(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            if (!isLookupPending) {
                              void handleLookupSubmit();
                            }
                          }
                        }}
                        className="pl-11"
                      />
                    </div>
                    <Button
                      onClick={() => {
                        void handleLookupSubmit();
                      }}
                      disabled={isLookupPending || !searchTerm.trim()}
                    >
                      {isLookupPending && <Spinner size="sm" />}
                      <span>Agregar</span>
                    </Button>
                  </div>
                </div>

                {searchTerm.trim() && (
                  <div className="rounded-lg border border-dashed bg-slate-50 p-3 dark:bg-slate-900/30">
                    {isSearchLoading ? (
                      <div className="space-y-2">
                        {[0, 1, 2].map((index) => (
                          <Skeleton key={index} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : searchResults.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {searchError ?? "No encontramos coincidencias"}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {searchResults.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => handleSelectProduct(product)}
                            className="flex w-full items-center gap-3 rounded-md border border-transparent bg-white p-2 text-left shadow-sm transition hover:border-primary hover:bg-primary/5 dark:bg-slate-900"
                          >
                            <Avatar className="bg-primary/10 text-primary">
                              <AvatarFallback>
                                {product.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {product.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                SKU {formatSku(product.sku)} ·{" "}
                                {formatCurrency(product.price)}
                              </p>
                            </div>
                            <IconPackage className="hidden size-5 text-muted-foreground md:block" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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
                  Asigna la venta a un cliente activo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pos-customer">Selecciona cliente</Label>
                  <Select
                    value={customerId}
                    onValueChange={setCustomerId}
                    disabled={customersLoading}
                  >
                    <SelectTrigger id="pos-customer">
                      <SelectValue placeholder="Selecciona un cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <IconUser className="size-4" />
                    <span>
                      {customerId
                        ? customers.find((c) => c.id === customerId)?.email
                        : "Sin cliente asignado"}
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
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Impuesto ({(taxRate * 100).toFixed(2)}%)
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(taxAmount)}
                  </span>
                </div>
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
    </PageTransition>
  );
}
