import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SetupWizardData } from "../SetupWizard";
import { Receipt } from "lucide-react";

interface TaxConfigStepProps {
  data: SetupWizardData;
  onChange: (updates: Partial<SetupWizardData>) => void;
}

export function TaxConfigStep({ data, onChange }: TaxConfigStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-primary">
        <Receipt className="h-8 w-8" />
        <div>
          <h3 className="text-lg font-semibold">Configuración de Impuestos</h3>
          <p className="text-sm text-muted-foreground">
            Define el impuesto que aplica a tus ventas
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="taxName">Nombre del Impuesto</Label>
          <Input
            id="taxName"
            value={data.taxName}
            onChange={(e) => onChange({ taxName: e.target.value })}
            placeholder="Ej: IVA, ITBIS, IGV, ISV..."
          />
          <p className="text-xs text-muted-foreground">
            El nombre que aparecerá en facturas y recibos.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="taxRate">Tasa de Impuesto (%)</Label>
          <Input
            id="taxRate"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={data.taxRate}
            onChange={(e) =>
              onChange({ taxRate: parseFloat(e.target.value) || 0 })
            }
            placeholder="0.00"
          />
          <p className="text-xs text-muted-foreground">
            Porcentaje de impuesto aplicado a las ventas. Usa 0 si no aplica.
          </p>
        </div>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium">Vista previa:</p>
          <p className="text-sm text-muted-foreground mt-1">
            {data.taxName || "Impuesto"}: {data.taxRate}%
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Por ejemplo, en una venta de $100.00, el impuesto sería $
            {((100 * data.taxRate) / 100).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
