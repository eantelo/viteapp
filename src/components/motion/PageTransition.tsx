import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const DEFAULT_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function PageTransition({ children, className }: PageTransitionProps) {
  const prefersReducedMotion = useReducedMotion();

  const variants = prefersReducedMotion
    ? {
        initial: { opacity: 1, y: 0, scale: 1 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 1, y: 0, scale: 1 },
      }
    : {
        initial: { opacity: 0, y: 24, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -24, scale: 0.98 },
      };

  return (
    <motion.div
      className={cn("min-h-full", className)}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        duration: prefersReducedMotion ? 0 : 0.45,
        ease: prefersReducedMotion ? undefined : DEFAULT_EASE,
      }}
    >
      {children}
    </motion.div>
  );
}
