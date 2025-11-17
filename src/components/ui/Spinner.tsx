import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap: Record<Required<SpinnerProps>["size"], string> = {
  sm: "h-4 w-4 border",
  md: "h-5 w-5 border-2",
  lg: "h-6 w-6 border-2",
};

export function Spinner({ className, size = "md" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-hidden="true"
      className={cn(
        "inline-flex animate-spin rounded-full border-current border-t-transparent",
        sizeMap[size],
        className
      )}
    />
  );
}
