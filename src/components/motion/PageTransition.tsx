import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EASING, DURATION } from "@/lib/motion";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const prefersReducedMotion = useReducedMotion();

  const variants = {
    initial: prefersReducedMotion
      ? { opacity: 1, y: 0 }
      : { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: prefersReducedMotion
      ? { opacity: 0 }
      : { opacity: 0, y: -8, scale: 0.99 },
  };

  return (
    <motion.div
      className={cn("min-h-full", className)}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        duration: DURATION.page,
        ease: EASING,
      }}
    >
      {children}
    </motion.div>
  );
}
