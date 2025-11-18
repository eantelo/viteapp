import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ShortcutBadgeProps {
  shortcut: string;
  className?: string;
  variant?: "default" | "secondary" | "outline" | "destructive";
}

/**
 * Badge que muestra un atajo de teclado de forma sutil
 * Se usa en botones para indicar atajos disponibles
 */
export function ShortcutBadge({
  shortcut,
  className,
  variant = "outline",
}: ShortcutBadgeProps) {
  return (
    <Badge
      variant={variant}
      className={cn(
        "text-xs font-mono opacity-60 transition-opacity group-hover:opacity-100",
        className
      )}
    >
      {shortcut}
    </Badge>
  );
}
