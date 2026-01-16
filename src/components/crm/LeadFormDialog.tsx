import { useEffect, useState, useMemo } from "react";
import { IconAlertCircle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LeadCreateDto, LeadDto, LeadUpdateDto } from "@/api/leadsApi";
import { LeadStatus, LeadSource } from "@/api/leadsApi";
import { createLead, updateLead } from "@/api/leadsApi";
import { getProducts, type ProductDto } from "@/api/productsApi";
import type { LeadPrefillData } from "@/contexts/FormPrefillContext";
import type { ApiError } from "@/api/apiClient";

interface LeadFormDialogProps {
  open: boolean;
  lead: LeadDto | null;
  prefillData?: LeadPrefillData | null;
  onClose: (saved: boolean) => void;
}

const statusOptions = [
  { value: LeadStatus.New, label: "Nuevo" },
  { value: LeadStatus.Contacted, label: "Contactado" },
  { value: LeadStatus.Qualified, label: "Calificado" },
  { value: LeadStatus.Proposal, label: "Propuesta" },
  { value: LeadStatus.Negotiation, label: "Negociación" },
  { value: LeadStatus.Won, label: "Ganado" },
  { value: LeadStatus.Lost, label: "Perdido" },
];

const sourceOptions = [
  { value: LeadSource.Website, label: "Sitio Web" },
  { value: LeadSource.Referral, label: "Referencia" },
  { value: LeadSource.SocialMedia, label: "Social Media" },
  { value: LeadSource.Advertisement, label: "Publicidad" },
  { value: LeadSource.ColdCall, label: "Llamada Fría" },
  { value: LeadSource.Event, label: "Evento" },
  { value: LeadSource.Other, label: "Otro" },
];

export function LeadFormDialog({
  open,
  lead,
  prefillData,
  onClose,
}: LeadFormDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [city, setCity] = useState("");
  const [productInterestId, setProductInterestId] = useState<string>("");
  const [status, setStatus] = useState<LeadStatus>(LeadStatus.New);
  const [source, setSource] = useState<string>("none");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [notes, setNotes] = useState("");
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = lead !== null;

  useEffect(() => {
    if (!open) return;

    const loadProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (err) {
        console.error("Error loading products:", err);
      }
    };

    loadProducts();

    if (lead) {
      setName(lead.name);
      setEmail(lead.email ?? "");
      setPhone(lead.phone ?? "");
      setCompany(lead.company ?? "");
      setCity(lead.city ?? "");
      setProductInterestId(lead.productInterestId ?? "");
      setStatus(lead.status);
      setSource(
        lead.source !== null && lead.source !== undefined
          ? lead.source.toString()
          : "none"
      );
      setEstimatedValue(lead.estimatedValue?.toString() ?? "");
      setNotes(lead.notes ?? "");
    } else if (prefillData) {
      setName(prefillData.name ?? "");
      setEmail(prefillData.email ?? "");
      setPhone(prefillData.phone ?? "");
      setCompany(prefillData.company ?? "");
      setCity(prefillData.city ?? "");
      setProductInterestId(prefillData.productInterestId ?? "");
      setStatus(LeadStatus.New);
      if (
        prefillData.source !== null &&
        prefillData.source !== undefined &&
        prefillData.source !== ""
      ) {
        setSource(prefillData.source.toString());
      } else {
        setSource("none");
      }
      setEstimatedValue(
        prefillData.estimatedValue !== undefined
          ? prefillData.estimatedValue.toString()
          : ""
      );
      setNotes(prefillData.notes ?? "");
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setCompany("");
      setCity("");
      setProductInterestId("");
      setStatus(LeadStatus.New);
      setSource("none");
      setEstimatedValue("");
      setNotes("");
    }
    setError(null);
  }, [open, lead, prefillData]);

  const isFormValid = useMemo(() => {
    return name.trim().length > 0;
  }, [name]);

  const normalizeOptional = (value: string) => {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  };

  const formatApiError = (submitError: unknown): string => {
    const defaultMessage = "Error al guardar el lead";

    if (submitError && typeof submitError === "object") {
      const apiError = submitError as ApiError;
      const details = apiError.details as
        | { message?: string; errors?: Record<string, string[]> }
        | undefined;

      if (details?.errors && typeof details.errors === "object") {
        const entries = Object.entries(details.errors)
          .flatMap(([field, messages]) =>
            (messages ?? []).map((msg) => `${field}: ${msg}`)
          )
          .filter(Boolean);

        if (entries.length > 0) {
          return `Error de validación:\n${entries.map((m) => `• ${m}`).join("\n")}`;
        }
      }

      if (details?.message) {
        return details.message;
      }

      if (apiError.message) {
        return apiError.message;
      }
    }

    return submitError instanceof Error ? submitError.message : defaultMessage;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error("El nombre es obligatorio.");
      }

      const baseDto = {
        name: trimmedName,
        email: normalizeOptional(email) ?? null,
        phone: normalizeOptional(phone),
        company: normalizeOptional(company),
        city: normalizeOptional(city),
        productInterestId: productInterestId || null,
        source:
          source !== "none" ? (parseInt(source, 10) as LeadSource) : null,
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
        notes: normalizeOptional(notes),
      };

      if (isEditing && lead) {
        const dto: LeadUpdateDto = baseDto;
        await updateLead(lead.id, dto);
      } else {
        const dto: LeadCreateDto = baseDto;
        await createLead(dto);
      }

      onClose(true);
    } catch (submitError) {
      setError(formatApiError(submitError));
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
              {isEditing ? "Editar Lead" : "Nuevo Lead"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Actualiza los datos del lead."
                : "Captura la información del nuevo lead."}
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
              <Label htmlFor="lead-name">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lead-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Juan García"
                maxLength={200}
                required
              />
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="lead-email">Email</Label>
              <Input
                id="lead-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@empresa.com"
                maxLength={320}
              />
            </div>

            {/* Teléfono */}
            <div className="grid gap-2">
              <Label htmlFor="lead-phone">Teléfono</Label>
              <Input
                id="lead-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+52 55 0000 0000"
                maxLength={30}
              />
            </div>

            {/* Empresa */}
            <div className="grid gap-2">
              <Label htmlFor="lead-company">Empresa</Label>
              <Input
                id="lead-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Ej: Tech Solutions S.A."
                maxLength={200}
              />
            </div>

            {/* Ciudad */}
            <div className="grid gap-2">
              <Label htmlFor="lead-city">Ciudad</Label>
              <Input
                id="lead-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ej: Ciudad de México"
                maxLength={120}
              />
            </div>

            {/* Producto de Interés */}
            <div className="grid gap-2">
              <Label htmlFor="lead-product">Producto de Interés</Label>
              <Select value={productInterestId} onValueChange={setProductInterestId}>
                <SelectTrigger id="lead-product">
                  <SelectValue placeholder="Selecciona un producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estado */}
            {isEditing && (
              <div className="grid gap-2">
                <Label htmlFor="lead-status">Estado</Label>
                <Select
                  value={status.toString()}
                  onValueChange={(value) => setStatus(parseInt(value) as LeadStatus)}
                >
                  <SelectTrigger id="lead-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value.toString()}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Fuente */}
            <div className="grid gap-2">
              <Label htmlFor="lead-source">Fuente</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger id="lead-source">
                  <SelectValue placeholder="Selecciona la fuente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin especificar</SelectItem>
                  {sourceOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Valor Estimado */}
            <div className="grid gap-2">
              <Label htmlFor="lead-value">Valor Estimado</Label>
              <Input
                id="lead-value"
                type="number"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            {/* Notas */}
            <div className="grid gap-2">
              <Label htmlFor="lead-notes">Notas / Actividad</Label>
              <Textarea
                id="lead-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anotaciones sobre el lead, llamadas, reuniones, etc."
                maxLength={4000}
              />
            </div>
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
