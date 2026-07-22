import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/** Renders page content without an entrance or exit animation. */
export function PageTransition({ children, className }: PageTransitionProps) {
  return <div className={cn("min-h-full", className)}>{children}</div>;
}
