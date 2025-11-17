import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  CustomerCreateDto,
  CustomerDto,
  CustomerUpdateDto,
} from "@/api/customersApi";
import { createCustomer, updateCustomer } from "@/api/customersApi";

interface CustomerFormDialogProps {
  open: boolean;
  customer: CustomerDto | null;
  onClose: (saved: boolean) => void;
}

export function CustomerFormDialog({
  open,
  customer,
  onClose,
}: CustomerFormDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [taxId, setTaxId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = customer !== null;

  useEffect(() => {
    if (!open) {
      return;
    }

    if (customer) {
      setName(customer.name);
      setEmail(customer.email);
      setPhone(customer.phone ?? "");
      setAddress(customer.address ?? "");
      setTaxId(customer.taxId ?? "");
      setIsActive(customer.isActive);
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
      setTaxId("");
      setIsActive(true);
    }
    setError(null);
  }, [open, customer]);

  const normalizeOptional = (value: string) => {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const trimmedName = name.trim();
      const trimmedEmail = email.trim();

      if (!trimmedName) {
        throw new Error("El nombre es obligatorio.");
      }

      if (!trimmedEmail) {
        throw new Error("El correo electronico es obligatorio.");
      }

      const baseDto = {
        name: trimmedName,
        email: trimmedEmail,
        phone: normalizeOptional(phone),
        address: normalizeOptional(address),
        taxId: normalizeOptional(taxId),
      };

      if (isEditing && customer) {
        const dto: CustomerUpdateDto = { ...baseDto, isActive };
        await updateCustomer(customer.id, dto);
      } else {
        const dto: CustomerCreateDto = baseDto;
        await createCustomer(dto);
      }

      onClose(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Error al guardar el cliente"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!loading) {
      onClose(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="sm:max-w-[560px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Cliente" : "Nuevo Cliente"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Actualiza los datos del cliente."
                : "Captura la informacion del nuevo cliente."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <div className="text-sm text-error bg-error/10 px-3 py-2 rounded-md">
                {error}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="customer-name">
                Nombre <span className="text-error">*</span>
              </Label>
              <Input
                id="customer-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej: Comercializadora ABC"
                maxLength={200}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="customer-email">
                Email <span className="text-error">*</span>
              </Label>
              <Input
                id="customer-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ventas@cliente.com"
                maxLength={320}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="customer-phone">Telefono</Label>
              <Input
                id="customer-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+52 55 0000 0000"
                maxLength={30}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="customer-address">Direccion</Label>
              <Input
                id="customer-address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Calle, numero, ciudad"
                maxLength={250}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="customer-tax-id">RFC / Tax ID</Label>
              <Input
                id="customer-tax-id"
                value={taxId}
                onChange={(event) => setTaxId(event.target.value)}
                placeholder="XAXX010101000"
                maxLength={30}
              />
            </div>

            {isEditing && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="customer-is-active"
                  checked={isActive}
                  onCheckedChange={(checked) => setIsActive(checked === true)}
                />
                <Label
                  htmlFor="customer-is-active"
                  className="text-sm font-normal cursor-pointer"
                >
                  Cliente activo
                </Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
