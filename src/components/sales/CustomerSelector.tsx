import { useState, useEffect, useRef, useMemo } from "react";
import {
  IconSearch,
  IconUserPlus,
  IconX,
  IconUser,
  IconMail,
  IconPhone,
  IconMapPin,
  IconCheck,
  IconLoader2,
  IconChevronDown,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { CustomerDto, CustomerCreateDto } from "@/api/customersApi";
import { createCustomer } from "@/api/customersApi";

interface CustomerSelectorProps {
  customers: CustomerDto[];
  selectedCustomerId: string;
  onSelectCustomer: (customerId: string) => void;
  onCustomerCreated?: (customer: CustomerDto) => void;
  disabled?: boolean;
  error?: string;
}

export function CustomerSelector({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  onCustomerCreated,
  disabled = false,
  error,
}: CustomerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cliente seleccionado
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  // Filtrar clientes por búsqueda
  const filteredCustomers = useMemo(() => {
    console.log(
      "[CustomerSelector] customers:",
      customers.length,
      "searchQuery:",
      searchQuery
    );
    if (!searchQuery.trim()) return customers;
    const query = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.phone?.toLowerCase().includes(query)
    );
  }, [customers, searchQuery]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Enfocar el input de búsqueda cuando se abre el dropdown
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchQuery("");
      }
    }
  };

  const handleSelect = (customer: CustomerDto) => {
    onSelectCustomer(customer.id);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectCustomer("");
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    setShowCreateDialog(true);
  };

  const handleCustomerCreated = (customer: CustomerDto) => {
    onSelectCustomer(customer.id);
    onCustomerCreated?.(customer);
    setShowCreateDialog(false);
  };

  return (
    <div className="space-y-2">
      <Label>
        Cliente <span className="text-destructive">*</span>
      </Label>

      {/* Trigger del selector */}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={cn(
            "w-full flex items-center justify-between gap-2 px-3 py-2 h-10 rounded-md border bg-background text-sm transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            disabled && "opacity-50 cursor-not-allowed",
            error && "border-destructive",
            isOpen && "ring-2 ring-ring ring-offset-2"
          )}
        >
          {selectedCustomer ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Avatar className="size-6 bg-primary/10 text-primary shrink-0">
                <AvatarFallback className="text-xs">
                  {selectedCustomer.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate font-medium">
                {selectedCustomer.name}
              </span>
              {selectedCustomer.totalPurchases !== undefined &&
                selectedCustomer.totalPurchases > 0 && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {selectedCustomer.totalPurchases} compra
                    {selectedCustomer.totalPurchases === 1 ? "" : "s"}
                  </Badge>
                )}
            </div>
          ) : (
            <span className="text-muted-foreground">Selecciona un cliente</span>
          )}

          <div className="flex items-center gap-1 shrink-0">
            {selectedCustomer && (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 rounded hover:bg-muted"
                aria-label="Quitar cliente"
              >
                <IconX className="size-4 text-muted-foreground" />
              </button>
            )}
            <IconChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden"
          >
            {/* Barra de búsqueda */}
            <div className="p-2 border-b">
              <div className="relative">
                <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre, email o teléfono..."
                  className="pl-8 h-9"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Lista de clientes */}
            <div className="max-h-64 overflow-y-auto">
              {filteredCustomers.length > 0 ? (
                <div className="p-1">
                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleSelect(customer)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left",
                        "hover:bg-accent",
                        customer.id === selectedCustomerId && "bg-accent"
                      )}
                    >
                      <Avatar className="size-9 bg-primary/10 text-primary shrink-0">
                        <AvatarFallback className="text-sm">
                          {customer.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {customer.name}
                          </p>
                          {customer.id === selectedCustomerId && (
                            <IconCheck className="size-4 text-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {customer.email}
                        </p>
                      </div>
                      {customer.totalPurchases !== undefined &&
                        customer.totalPurchases > 0 && (
                          <Badge
                            variant="secondary"
                            className="text-xs shrink-0"
                          >
                            {customer.totalPurchases}
                          </Badge>
                        )}
                    </button>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <p>No se encontraron clientes</p>
                  <p className="text-xs mt-1">
                    Prueba con otro término o crea uno nuevo
                  </p>
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No hay clientes disponibles
                </div>
              )}
            </div>

            {/* Botón crear nuevo */}
            <div className="border-t p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCreateNew}
                className="w-full justify-start gap-2"
              >
                <IconUserPlus className="size-4" />
                Crear nuevo cliente
              </Button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Preview del cliente seleccionado */}
      {selectedCustomer && (
        <CustomerPreviewCard
          customer={selectedCustomer}
          onClear={() => onSelectCustomer("")}
        />
      )}

      {/* Dialog para crear cliente */}
      <QuickCustomerCreateDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreated={handleCustomerCreated}
        initialName={searchQuery}
      />
    </div>
  );
}

// ---- Componentes auxiliares ----

interface CustomerPreviewCardProps {
  customer: CustomerDto;
  onClear: () => void;
}

function CustomerPreviewCard({ customer, onClear }: CustomerPreviewCardProps) {
  return (
    <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-muted">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Avatar className="size-10 bg-primary/10 text-primary shrink-0">
            <AvatarFallback>
              {customer.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-1">
            <p className="font-semibold text-sm">{customer.name}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <IconMail className="size-3" />
                {customer.email}
              </span>
              {customer.phone && (
                <span className="flex items-center gap-1">
                  <IconPhone className="size-3" />
                  {customer.phone}
                </span>
              )}
              {customer.address && (
                <span className="flex items-center gap-1">
                  <IconMapPin className="size-3" />
                  {customer.address}
                </span>
              )}
            </div>
            {(customer.totalPurchases !== undefined ||
              customer.loyaltyPoints !== undefined) && (
              <div className="flex gap-2 mt-1">
                {customer.totalPurchases !== undefined &&
                  customer.totalPurchases > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {customer.totalPurchases} compra
                      {customer.totalPurchases === 1 ? "" : "s"}
                    </Badge>
                  )}
                {customer.loyaltyPoints !== undefined &&
                  customer.loyaltyPoints > 0 && (
                    <Badge
                      variant="outline"
                      className="text-xs text-amber-600 border-amber-300"
                    >
                      {customer.loyaltyPoints} pts
                    </Badge>
                  )}
              </div>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          onClick={onClear}
          aria-label="Cambiar cliente"
        >
          <IconX className="size-4" />
        </Button>
      </div>
    </div>
  );
}

interface QuickCustomerCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (customer: CustomerDto) => void;
  initialName?: string;
}

function QuickCustomerCreateDialog({
  open,
  onClose,
  onCreated,
  initialName = "",
}: QuickCustomerCreateDialogProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form cuando se abre
  useEffect(() => {
    if (open) {
      setName(initialName);
      setEmail("");
      setPhone("");
      setError(null);
    }
  }, [open, initialName]);

  const isValid = useMemo(() => {
    return (
      name.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    );
  }, [name, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || loading) return;

    setLoading(true);
    setError(null);

    try {
      const dto: CustomerCreateDto = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
      };
      const newCustomer = await createCustomer(dto);
      onCreated(newCustomer);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al crear el cliente"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconUserPlus className="size-5 text-primary" />
              Nuevo Cliente
            </DialogTitle>
            <DialogDescription>
              Crea un cliente rápidamente para continuar con la venta.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                {error}
              </div>
            )}

            {/* Nombre */}
            <div className="grid gap-2">
              <Label htmlFor="quick-customer-name">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="quick-customer-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre del cliente"
                  className="pl-9"
                  autoFocus
                />
              </div>
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="quick-customer-email">
                Email <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="quick-customer-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@ejemplo.com"
                  className="pl-9"
                />
              </div>
            </div>

            {/* Teléfono (opcional) */}
            <div className="grid gap-2">
              <Label htmlFor="quick-customer-phone">Teléfono (opcional)</Label>
              <div className="relative">
                <IconPhone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="quick-customer-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+52 55 0000 0000"
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid || loading}>
              {loading ? (
                <>
                  <IconLoader2 className="size-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <IconCheck className="size-4 mr-2" />
                  Crear y seleccionar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
