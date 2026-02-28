import { MagnifyingGlass } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { staggerItem, getMotionProps } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  /** Current search value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Number of filtered results (shown as badge) */
  resultCount?: number;
  /** Total number of items */
  totalCount?: number;
  /** Additional CSS classes for the outer container */
  className?: string;
  /** Accessible label for the input */
  ariaLabel?: string;
  /** Optional onKeyDown handler */
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /** Whether to animate entrance (default: true) */
  animate?: boolean;
}

/**
 * Standardized search input with icon, optional result count,
 * and consistent styling across all pages.
 *
 * @example
 * <SearchInput
 *   value={search}
 *   onChange={setSearch}
 *   placeholder="Buscar por nombre, email..."
 *   resultCount={filteredItems.length}
 *   totalCount={items.length}
 * />
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  resultCount,
  totalCount,
  className,
  ariaLabel,
  onKeyDown,
  animate = true,
}: SearchInputProps) {
  const prefersReducedMotion = useReducedMotion();
  const motionProps = animate ? getMotionProps(prefersReducedMotion) : {};

  const showCount = resultCount !== undefined && totalCount !== undefined;

  return (
    <motion.div
      className={cn("space-y-2", className)}
      variants={staggerItem}
      {...motionProps}
    >
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center text-muted-foreground">
          <MagnifyingGlass size={18} weight="bold" />
        </span>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="pl-10"
          aria-label={ariaLabel ?? placeholder}
        />
      </div>
      {showCount && (
        <p className="text-xs tabular-nums text-muted-foreground">
          {resultCount} resultado{resultCount !== 1 ? "s" : ""}
          {totalCount !== resultCount && ` de ${totalCount}`}
        </p>
      )}
    </motion.div>
  );
}
