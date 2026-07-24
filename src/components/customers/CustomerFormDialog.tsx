import { useEffect, useState, useMemo } from "react";
import { WarningCircle, Check, Crosshair } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
  onClose: (saved: boolean, savedCustomer?: CustomerDto) => void;
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
  const [city, setCity] = useState("");
  const [taxId, setTaxId] = useState("");
  const [note, setNote] = useState("");
  const [gps, setGps] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Field validation state
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    address: false,
    city: false,
    taxId: false,
    note: false,
    gps: false,
  });

  const isEditing = customer !== null;

  useEffect(() => {
    if (!open) {
      return;
    }

    if (customer) {
      setName(customer.name);
      setEmail(customer.email ?? "");
      setPhone(customer.phone ?? "");
      setAddress(customer.address ?? "");
      setCity(customer.city ?? "");
      setTaxId(customer.taxId ?? "");
      setNote(customer.note ?? "");
      setGps(customer.gps ?? "");
      setIsActive(customer.isActive);
    } else if (prefillData) {
      // Apply prefill data from interface agent
      setName(prefillData.name ?? "");
      setEmail(prefillData.email ?? "");
      setPhone(prefillData.phone ?? "");
      setAddress(prefillData.address ?? "");
      setCity(prefillData.city ?? "");
      setTaxId(prefillData.taxId ?? "");
      setNote(prefillData.note ?? "");
      setGps(prefillData.gps ?? "");
      setIsActive(true);
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
      setCity("");
      setTaxId("");
      setNote("");
      setGps("");
      setIsActive(true);
    }
    setError(null);
    setTouched({
      name: false,
      email: false,
      phone: false,
      address: false,
      city: false,
      taxId: false,
      note: false,
      gps: false,
    });
  }, [open, customer, prefillData]);

  // Validations
  const validations = useMemo(() => {
    const nameValid = name.trim().length > 0;
    const trimmedEmail = email.trim();
    const emailValid =
      trimmedEmail.length === 0 ||
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
    const compactPhone = phone.replace(/[\s().-]/g, "").replace(/^00591/, "+591").replace(/^591/, "+591");
    const phoneValid =
      phone.trim().length === 0 || /^\+591[67]\d{7}$/.test(compactPhone);
    const addressValid = true; // Optional field
    const cityValid = true; // Optional field
    const taxIdValid = true; // Optional field
    const noteValid = true; // Optional field
    const gpsParts = gps.split(",").map((part) => Number(part.trim()));
    const gpsValid =
      gps.trim().length === 0 ||
      (gpsParts.length === 2 &&
        Number.isFinite(gpsParts[0]) &&
        Number.isFinite(gpsParts[1]) &&
        gpsParts[0] >= -90 &&
        gpsParts[0] <= 90 &&
        gpsParts[1] >= -180 &&
        gpsParts[1] <= 180);

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
            ? "Usa un celular boliviano con +591, por ejemplo +591 70000000"
            : undefined,
      },
      address: {
        isValid: addressValid,
        isTouched: touched.address,
        error:
          touched.gps && !gpsValid
            ? "Ingresa latitud,longitud válidas"
            : undefined,
      },
      city: {
        isValid: cityValid,
        isTouched: touched.city,
        error: undefined,
      },
      taxId: {
        isValid: taxIdValid,
        isTouched: touched.taxId,
        error: undefined,
      },
      note: {
        isValid: noteValid,
        isTouched: touched.note,
        error: undefined,
      },
      gps: {
        isValid: gpsValid,
        isTouched: touched.gps,
        error: undefined,
      },
    };
  }, [name, email, phone, gps, touched]);

  const isFormValid =
    validations.name.isValid &&
    validations.email.isValid &&
    validations.phone.isValid &&
    validations.gps.isValid;

  const normalizeOptional = (value: string) => {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setTouched((current) =>
      Object.fromEntries(Object.keys(current).map((key) => [key, true])) as typeof current
    );

    if (!isFormValid) {
      setError("Revisa los campos marcados antes de guardar.");
      return;
    }

    setLoading(true);

    try {
      const trimmedName = name.trim();
      const trimmedEmail = email.trim();
      const hasEmail = trimmedEmail.length > 0;

      if (!trimmedName) {
        throw new Error("El nombre es obligatorio.");
      }

      if (hasEmail && !validations.email.isValid) {
        throw new Error("Ingresa un correo electrónico válido.");
      }

      const baseDto = {
        name: trimmedName,
        email: normalizeOptional(trimmedEmail) ?? null,
        phone: normalizeOptional(phone),
        address: normalizeOptional(address),
        city: normalizeOptional(city),
        taxId: normalizeOptional(taxId),
        note: normalizeOptional(note),
        gps: normalizeOptional(gps),
      };

      if (isEditing && customer) {
        const dto: CustomerUpdateDto = { ...baseDto, isActive };
        await updateCustomer(customer.id, dto);
        onClose(true, { ...customer, ...dto });
      } else {
        const dto: CustomerCreateDto = baseDto;
        const createdCustomer = await createCustomer(dto);
        onClose(true, createdCustomer);
      }
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

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Este navegador no permite obtener la ubicación actual.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setGps(`${coords.latitude.toFixed(6)},${coords.longitude.toFixed(6)}`);
        setTouched((current) => ({ ...current, gps: true }));
        setError(null);
      },
      () => setError("No se pudo obtener la ubicación. Revisa el permiso del navegador."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
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
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[760px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Cliente" : "Nuevo Cliente"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Actualiza los datos del cliente."
                : "Captura la información del nuevo cliente."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                <WarningCircle className="size-4 shrink-0" weight="duotone" />
                {error}
              </div>
            )}

            <fieldset className="grid gap-4 md:grid-cols-2">
              <legend className="col-span-full mb-1 text-sm font-semibold">Información principal</legend>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="customer-name">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="customer-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  onBlur={() => handleFieldBlur("name")}
                  placeholder="Ej: María Pérez"
                  maxLength={200}
                  required
                  className={cn("pr-9", getFieldClasses(validations.name))}
                />
                {validations.name.isTouched && validations.name.isValid && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-green-500" weight="duotone" />
                )}
              </div>
              {validations.name.error && (
                <p className="text-xs text-destructive">
                  {validations.name.error}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="customer-email">
                Email
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
                  className={cn("pr-9", getFieldClasses(validations.email))}
                />
                {validations.email.isTouched && validations.email.isValid && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-green-500" weight="duotone" />
                )}
              </div>
              {validations.email.error && (
                <p className="text-xs text-destructive">
                  {validations.email.error}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="customer-phone">Teléfono</Label>
              <div className="relative">
                <Input
                  id="customer-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  onBlur={() => handleFieldBlur("phone")}
                  placeholder="+591 70000000"
                  maxLength={30}
                  className={cn("pr-9", getFieldClasses(validations.phone))}
                />
                {validations.phone.isTouched &&
                  validations.phone.isValid &&
                  phone.trim() && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-green-500" weight="duotone" />
                  )}
              </div>
              {validations.phone.error && (
                <p className="text-xs text-destructive">
                  {validations.phone.error}
                </p>
              )}
            </div>
            </fieldset>

            <fieldset className="grid gap-4 md:grid-cols-2">
              <legend className="col-span-full mb-1 text-sm font-semibold">Ubicación</legend>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="customer-address">Dirección</Label>
              <Input
                id="customer-address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                onBlur={() => handleFieldBlur("address")}
                placeholder="Calle, número y zona"
                maxLength={250}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="customer-city">Ciudad</Label>
              <Input
                id="customer-city"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                onBlur={() => handleFieldBlur("city")}
                placeholder="Ej: Santa Cruz de la Sierra"
                maxLength={120}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="customer-gps">Ubicación GPS</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="customer-gps"
                  value={gps}
                  onChange={(event) => setGps(event.target.value)}
                  onBlur={() => handleFieldBlur("gps")}
                  placeholder="-17.7833,-63.1821"
                  maxLength={120}
                  className={getFieldClasses(validations.gps)}
                />
                <Button type="button" variant="outline" onClick={handleUseCurrentLocation} className="gap-2 whitespace-nowrap">
                  <Crosshair size={16} />
                  Usar ubicación actual
                </Button>
              </div>
              {validations.gps.error && <p className="text-xs text-destructive">{validations.gps.error}</p>}
              {gps.trim() && validations.gps.isValid && (
                <a
                  href={`https://www.google.com/maps?q=${encodeURIComponent(gps)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary underline-offset-4 hover:underline"
                >
                  Vista previa en el mapa
                </a>
              )}
            </div>
            </fieldset>

            <fieldset className="grid gap-4">
              <legend className="mb-1 text-sm font-semibold">Información fiscal</legend>
            <div className="grid gap-2">
              <Label htmlFor="customer-tax-id">NIT / documento tributario</Label>
              <Input
                id="customer-tax-id"
                value={taxId}
                onChange={(event) => setTaxId(event.target.value)}
                onBlur={() => handleFieldBlur("taxId")}
                placeholder="Ej: 1020304050"
                maxLength={30}
              />
            </div>
            </fieldset>

            <fieldset className="grid gap-4">
              <legend className="mb-1 text-sm font-semibold">Información interna</legend>
            <div className="grid gap-2">
              <Label htmlFor="customer-note">Nota</Label>
              <Textarea
                id="customer-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                onBlur={() => handleFieldBlur("note")}
                placeholder="Información adicional del cliente"
                maxLength={1000}
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
            </fieldset>
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
