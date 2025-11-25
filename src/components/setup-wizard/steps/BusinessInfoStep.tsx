import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SetupWizardData } from "../SetupWizard";
import { Building2 } from "lucide-react";

interface BusinessInfoStepProps {
  data: SetupWizardData;
  onChange: (updates: Partial<SetupWizardData>) => void;
}

export function BusinessInfoStep({ data, onChange }: BusinessInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-primary">
        <Building2 className="h-8 w-8" />
        <div>
          <h3 className="text-lg font-semibold">Información del Negocio</h3>
          <p className="text-sm text-muted-foreground">
            Ingresa el nombre de tu negocio
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="businessName">Nombre del Negocio *</Label>
          <Input
            id="businessName"
            value={data.businessName}
            onChange={(e) => onChange({ businessName: e.target.value })}
            placeholder="Mi Negocio S.A."
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Este nombre aparecerá en facturas, recibos y reportes.
          </p>
        </div>
      </div>
    </div>
  );
}
