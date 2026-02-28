import type { ComponentType } from "react";
import type { IconProps } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";
import { fadeInUp, getMotionProps } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  /** Phosphor icon to display */
  icon: ComponentType<IconProps>;
  /** Main heading */
  title: string;
  /** Supporting description */
  description?: string;
  /** Optional action button label */
  actionLabel?: string;
  /** Action button handler */
  onAction?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Consistent empty state / no-results component.
 * Use when a list, table or search returns zero items.
 *
 * @example
 * <EmptyState
 *   icon={Package}
 *   title="Sin productos"
 *   description="Agrega tu primer producto para comenzar."
 *   actionLabel="Nuevo producto"
 *   onAction={() => navigate('/products/new')}
 * />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const prefersReducedMotion = useReducedMotion();
  const motionProps = getMotionProps(prefersReducedMotion);

  return (
    <motion.div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-16 text-center",
        className
      )}
      variants={fadeInUp}
      {...motionProps}
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon size={24} weight="duotone" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
