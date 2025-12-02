import { useEffect, useState, useMemo } from "react";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
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
import { cn } from "@/lib/utils";
import type {
  CustomerCreateDto,
  CustomerDto,
  CustomerUpdateDto,
} from "@/api/customersApi";
import { createCustomer, updateCustomer } from "@/api/customersApi";
import type { CustomerPrefillData } from "@/contexts/FormPrefillContext";

interface CustomerFormDialogProps {
  open: boolean;
  customer: CustomerDto | null;
  prefillData?: CustomerPrefillData | null;
  onClose: (saved: boolean) => void;
}

interface FieldValidation {
  isValid: boolean;
  isTouched: boolean;
  error?: string;
}

export function CustomerFormDialog({
  open,
  customer,
  prefillData,
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

  // Field validation state
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    address: false,
    taxId: false,
  });

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
    } else if (prefillData) {
      // Apply prefill data from interface agent
      setName(prefillData.name ?? "");
      setEmail(prefillData.email ?? "");
      setPhone(prefillData.phone ?? "");
      setAddress(prefillData.address ?? "");
      setTaxId(prefillData.taxId ?? "");
      setIsActive(true);
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
      setTaxId("");
      setIsActive(true);
    }
    setError(null);
    setTouched({
      name: false,
      email: false,
      phone: false,
      address: false,
      taxId: false,
    });
  }, [open, customer, prefillData]);

  // Validations
  const validations = useMemo(() => {
    const nameValid = name.trim().length > 0;
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const phoneValid = phone.trim().length === 0 || phone.trim().length >= 10;
    const addressValid = true; // Optional field
    const taxIdValid = true; // Optional field

    return {
      name: {
        isValid: nameValid,
        isTouched: touched.name,
        error:
          touched.name && !nameValid ? "El nombre es obligatorio" : undefined,
      },
      email: {
        isValid: emailValid,
        isTouched: touched.email,
        error:
          touched.email && !emailValid ? "Ingresa un email válido" : undefined,
      },
      phone: {
        isValid: phoneValid,
        isTouched: touched.phone,
        error:
          touched.phone && !phoneValid
            ? "El teléfono debe tener al menos 10 dígitos"
            : undefined,
      },
      address: {
        isValid: addressValid,
        isTouched: touched.address,
        error: undefined,
      },
      taxId: {
        isValid: taxIdValid,
        isTouched: touched.taxId,
        error: undefined,
      },
    };
  }, [name, email, phone, address, taxId, touched]);

  const isFormValid = validations.name.isValid && validations.email.isValid;

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

  const handleFieldBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const getFieldClasses = (validation: FieldValidation) => {
    if (!validation.isTouched) return "";
    return validation.isValid ? "border-green-500" : "border-destructive";
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
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                <IconAlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Nombre */}
            <div className="grid gap-2">
              <Label htmlFor="customer-name">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="customer-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  onBlur={() => handleFieldBlur("name")}
                  placeholder="Ej: Comercializadora ABC"
                  maxLength={200}
                  required
                  className={cn("pr-9", getFieldClasses(validations.name))}
                />
                {validations.name.isTouched && validations.name.isValid && (
                  <IconCheck className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-green-500" />
                )}
              </div>
              {validations.name.error && (
                <p className="text-xs text-destructive">
                  {validations.name.error}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="customer-email">
                Email <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="customer-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onBlur={() => handleFieldBlur("email")}
                  placeholder="ventas@cliente.com"
                  maxLength={320}
                  required
                  className={cn("pr-9", getFieldClasses(validations.email))}
                />
                {validations.email.isTouched && validations.email.isValid && (
                  <IconCheck className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-green-500" />
                )}
              </div>
              {validations.email.error && (
                <p className="text-xs text-destructive">
                  {validations.email.error}
                </p>
              )}
            </div>

            {/* Teléfono */}
            <div className="grid gap-2">
              <Label htmlFor="customer-phone">Teléfono</Label>
              <div className="relative">
                <Input
                  id="customer-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  onBlur={() => handleFieldBlur("phone")}
                  placeholder="+52 55 0000 0000"
                  maxLength={30}
                  className={cn("pr-9", getFieldClasses(validations.phone))}
                />
                {validations.phone.isTouched &&
                  validations.phone.isValid &&
                  phone.trim() && (
                    <IconCheck className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-green-500" />
                  )}
              </div>
              {validations.phone.error && (
                <p className="text-xs text-destructive">
                  {validations.phone.error}
                </p>
              )}
            </div>

            {/* Dirección */}
            <div className="grid gap-2">
              <Label htmlFor="customer-address">Dirección</Label>
              <Input
                id="customer-address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                onBlur={() => handleFieldBlur("address")}
                placeholder="Calle, numero, ciudad"
                maxLength={250}
              />
            </div>

            {/* RFC / Tax ID */}
            <div className="grid gap-2">
              <Label htmlFor="customer-tax-id">RFC / Tax ID</Label>
              <Input
                id="customer-tax-id"
                value={taxId}
                onChange={(event) => setTaxId(event.target.value)}
                onBlur={() => handleFieldBlur("taxId")}
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
            <Button type="submit" disabled={loading || !isFormValid}>
              {loading ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
