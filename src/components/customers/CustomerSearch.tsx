import { useEffect, useState, useCallback, useRef } from "react";
import { IconSearch, IconLoader2, IconAlertCircle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { CustomerDto } from "@/api/customersApi";

interface CustomerSearchProps {
  value: string;
  onChange: (value: string) => void;
  results: CustomerDto[];
  onSelect: (customer: CustomerDto) => void;
  onCreateNew: () => void;
  isLoading?: boolean;
  error?: string | null;
  placeholder?: string;
  label?: string;
  ref?: React.Ref<HTMLInputElement>;
  className?: string;
}

export const CustomerSearch = ({
  value,
  onChange,
  results,
  onSelect,
  onCreateNew,
  isLoading = false,
  error = null,
  placeholder = "Busca por nombre o email",
  label = "Buscar cliente",
  className,
}: CustomerSearchProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (customer: CustomerDto) => {
      onSelect(customer);
      setIsOpen(false);
      onChange("");
    },
    [onSelect, onChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(newValue.trim().length > 0);
  };

  const hasResults = results.length > 0;
  const showDropdown = isOpen && (value.trim().length > 0 || error);

  return (
    <div className={cn("relative w-full", className)}>
      {label && <Label htmlFor="customer-search">{label}</Label>}

      <div className="relative mt-2">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            id="customer-search"
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={() => value.trim().length > 0 && setIsOpen(true)}
            placeholder={placeholder}
            className="pl-9 pr-9"
            autoComplete="off"
          />
          {isLoading && (
            <IconLoader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Dropdown de resultados */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50"
          >
            <div className="max-h-72 overflow-y-auto">
              {error ? (
                <div className="flex items-center gap-2 p-3 text-sm text-destructive">
                  <IconAlertCircle className="size-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                  <IconLoader2 className="size-4 animate-spin" />
                  Buscando clientes...
                </div>
              ) : hasResults ? (
                <div className="space-y-1 p-1">
                  {results.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleSelect(customer)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      <Avatar className="size-8 bg-primary/10 text-primary flex-shrink-0">
                        <AvatarFallback className="text-xs">
                          {customer.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {customer.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {customer.email}
                        </p>
                      </div>
                      {customer.totalPurchases !== undefined &&
                        customer.totalPurchases > 0 && (
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {customer.totalPurchases} compra
                            {customer.totalPurchases === 1 ? "" : "s"}
                          </span>
                        )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  No se encontraron clientes
                </div>
              )}
            </div>

            {/* Pie del dropdown con opción de crear nuevo */}
            <div className="border-t border-slate-200 dark:border-slate-700 p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCreateNew}
                className="w-full justify-center text-xs"
              >
                Crear nuevo cliente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
