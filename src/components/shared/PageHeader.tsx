import type { ReactNode, ComponentType } from "react";
import type { IconProps } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";
import { staggerContainer, staggerItem, getMotionProps } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  /** Page title — rendered as h1 */
  title: string;
  /** Short description below the title */
  description?: string;
  /** Optional Phosphor icon displayed beside the title */
  icon?: ComponentType<IconProps>;
  /** Optional category label above the title (e.g. "Panel de análisis") */
  sectionLabel?: string;
  /** Action elements (buttons) rendered on the right side */
  actions?: ReactNode;
  /** Additional CSS classes for the header container */
  className?: string;
}

/**
 * Standardized page header for all protected pages.
 *
 * Renders a title + description + optional icon and action buttons
 * with consistent typography, spacing, and staggered entrance animation.
 *
 * @example
 * <PageHeader
 *   title="Productos"
 *   description="Gestiona tu catálogo de productos."
 *   icon={Package}
 *   actions={<Button><Plus size={18} weight="bold" /> Nuevo</Button>}
 * />
 */
export function PageHeader({
  title,
  description,
  icon: Icon,
  sectionLabel,
  actions,
  className,
}: PageHeaderProps) {
  const prefersReducedMotion = useReducedMotion();
  const motionProps = getMotionProps(prefersReducedMotion);

  return (
    <motion.header
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      variants={staggerContainer}
      {...motionProps}
    >
      <motion.div className="flex items-center gap-3" variants={staggerItem}>
        {Icon && (
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-primary shadow-sm">
            <Icon size={20} weight="duotone" />
          </span>
        )}
        <div className="space-y-0.5">
          {sectionLabel && (
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {sectionLabel}
            </p>
          )}
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </motion.div>

      {actions && (
        <motion.div
          className="flex flex-wrap items-center gap-2"
          variants={staggerItem}
        >
          {actions}
        </motion.div>
      )}
    </motion.header>
  );
}
