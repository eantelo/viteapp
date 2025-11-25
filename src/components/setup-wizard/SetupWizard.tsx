import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { updateTenantSettings } from "@/api/tenantSettingsApi";
import { useAuth } from "@/context/AuthContext";
import type { TenantSettings } from "@/types/TenantSettings";
import { BusinessInfoStep } from "./steps/BusinessInfoStep";
import { RegionalSettingsStep } from "./steps/RegionalSettingsStep";
import { TaxConfigStep } from "./steps/TaxConfigStep";
import { Building2, Globe, Receipt, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SetupWizardData {
  businessName: string;
  currencyCode: string;
  timezone: string;
  taxName: string;
  taxRate: number;
}

const STEPS = [
  { id: 1, title: "Negocio", icon: Building2 },
  { id: 2, title: "Regional", icon: Globe },
  { id: 3, title: "Impuestos", icon: Receipt },
] as const;

interface SetupWizardProps {
  open: boolean;
  onComplete: () => void;
}

export function SetupWizard({ open, onComplete }: SetupWizardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { auth, setAuth } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<SetupWizardData>({
    businessName: "",
    currencyCode: "USD",
    timezone: "America/New_York",
    taxName: "",
    taxRate: 0,
  });

  const progress = ((currentStep - 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDataChange = (updates: Partial<SetupWizardData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const settings: TenantSettings = {
        currencyCode: data.currencyCode,
        timezone: data.timezone,
        taxName: data.taxName,
        taxRate: data.taxRate,
        isSetupComplete: true,
      };

      await updateTenantSettings(settings);

      // Update auth context to reflect setup completion
      if (auth) {
        setAuth({ ...auth, isSetupComplete: true });
      }

      toast({
        title: "¡Configuración completada!",
        description: "Tu negocio está listo para comenzar.",
      });

      onComplete();
      navigate("/dashboard");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la configuración. Intenta de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BusinessInfoStep data={data} onChange={handleDataChange} />;
      case 2:
        return <RegionalSettingsStep data={data} onChange={handleDataChange} />;
      case 3:
        return <TaxConfigStep data={data} onChange={handleDataChange} />;
      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return data.businessName.trim().length > 0;
      case 2:
        return data.currencyCode.length === 3;
      case 3:
        return true; // Tax config is optional
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-[600px]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">Configuración inicial</DialogTitle>
          <DialogDescription>
            Configura tu negocio en unos simples pasos
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="py-4">
          <div className="flex justify-between mb-2">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex flex-col items-center gap-2 flex-1",
                    isActive && "text-primary",
                    isCompleted && "text-primary",
                    !isActive && !isCompleted && "text-muted-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                      isActive &&
                        "border-primary bg-primary text-primary-foreground",
                      isCompleted &&
                        "border-primary bg-primary text-primary-foreground",
                      !isActive && !isCompleted && "border-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className="text-xs font-medium">{step.title}</span>
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="py-4 min-h-[200px]">{renderStep()}</div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
          >
            Anterior
          </Button>

          {currentStep < STEPS.length ? (
            <Button onClick={handleNext} disabled={!isStepValid()}>
              Siguiente
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Finalizar configuración
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
