import { Badge } from "@/components/ui/badge";
import { Fire } from "@phosphor-icons/react";

interface KeyPressIndicatorProps {
  show: boolean;
  keyLabel: string;
}

/**
 * Componente que muestra un indicador visual cuando se presiona un atajo
 */
export function KeyPressIndicator({ show, keyLabel }: KeyPressIndicatorProps) {
  if (!show) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
      <Badge className="gap-2 bg-primary text-primary-foreground shadow-lg">
        <Fire className="size-3" weight="duotone" />
        <span className="font-mono text-xs font-bold">{keyLabel}</span>
      </Badge>
    </div>
  );
}
