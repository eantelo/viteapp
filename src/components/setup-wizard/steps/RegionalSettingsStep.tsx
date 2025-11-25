import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SetupWizardData } from "../SetupWizard";
import { Globe } from "lucide-react";

interface RegionalSettingsStepProps {
  data: SetupWizardData;
  onChange: (updates: Partial<SetupWizardData>) => void;
}

const CURRENCIES = [
  { code: "USD", name: "Dólar Estadounidense", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "MXN", name: "Peso Mexicano", symbol: "$" },
  { code: "COP", name: "Peso Colombiano", symbol: "$" },
  { code: "ARS", name: "Peso Argentino", symbol: "$" },
  { code: "CLP", name: "Peso Chileno", symbol: "$" },
  { code: "PEN", name: "Sol Peruano", symbol: "S/" },
  { code: "DOP", name: "Peso Dominicano", symbol: "RD$" },
  { code: "GTQ", name: "Quetzal Guatemalteco", symbol: "Q" },
  { code: "HNL", name: "Lempira Hondureño", symbol: "L" },
  { code: "NIO", name: "Córdoba Nicaragüense", symbol: "C$" },
  { code: "CRC", name: "Colón Costarricense", symbol: "₡" },
  { code: "PAB", name: "Balboa Panameño", symbol: "B/." },
  { code: "BRL", name: "Real Brasileño", symbol: "R$" },
  { code: "VES", name: "Bolívar Venezolano", symbol: "Bs." },
];

const TIMEZONES = [
  { value: "America/New_York", label: "Nueva York (EST/EDT)" },
  { value: "America/Chicago", label: "Chicago (CST/CDT)" },
  { value: "America/Denver", label: "Denver (MST/MDT)" },
  { value: "America/Los_Angeles", label: "Los Ángeles (PST/PDT)" },
  { value: "America/Mexico_City", label: "Ciudad de México" },
  { value: "America/Bogota", label: "Bogotá" },
  { value: "America/Lima", label: "Lima" },
  { value: "America/Santiago", label: "Santiago" },
  { value: "America/Buenos_Aires", label: "Buenos Aires" },
  { value: "America/Sao_Paulo", label: "São Paulo" },
  { value: "America/Caracas", label: "Caracas" },
  { value: "America/Santo_Domingo", label: "Santo Domingo" },
  { value: "America/Guatemala", label: "Guatemala" },
  { value: "America/Panama", label: "Panamá" },
  { value: "America/Costa_Rica", label: "Costa Rica" },
  { value: "Europe/Madrid", label: "Madrid" },
  { value: "Europe/London", label: "Londres" },
];

export function RegionalSettingsStep({
  data,
  onChange,
}: RegionalSettingsStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-primary">
        <Globe className="h-8 w-8" />
        <div>
          <h3 className="text-lg font-semibold">Configuración Regional</h3>
          <p className="text-sm text-muted-foreground">
            Define tu moneda y zona horaria
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currencyCode">Moneda *</Label>
          <Select
            value={data.currencyCode}
            onValueChange={(value) => onChange({ currencyCode: value })}
          >
            <SelectTrigger id="currencyCode">
              <SelectValue placeholder="Selecciona una moneda" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.code} - {currency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Todos los precios y transacciones usarán esta moneda.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Zona Horaria</Label>
          <Select
            value={data.timezone}
            onValueChange={(value) => onChange({ timezone: value })}
          >
            <SelectTrigger id="timezone">
              <SelectValue placeholder="Selecciona una zona horaria" />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Se usará para mostrar fechas y horas correctamente.
          </p>
        </div>

        <div className="hidden">
          <Input type="hidden" />
        </div>
      </div>
    </div>
  );
}
