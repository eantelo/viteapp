/**
 * Shared motion constants for consistent animations across the Sales UI.
 *
 * Design direction: Sophistication & Trust — smooth, enterprise-grade easing
 * with no spring/bouncy effects. All animations respect `prefers-reduced-motion`.
 */
import type { Variants, Transition } from "framer-motion";

// ─── Easing ──────────────────────────────────────────────────────────────────
/** Enterprise-grade deceleration curve — fast start, smooth settle. */
export const EASING: [number, number, number, number] = [0.25, 1, 0.5, 1];

// ─── Durations (ms) ─────────────────────────────────────────────────────────
export const DURATION = {
  /** Micro-interactions: toggles, hovers, focus rings */
  micro: 0.15,
  /** Standard element transitions: fade-in, slide */
  standard: 0.2,
  /** Page-level transitions */
  page: 0.3,
} as const;

// ─── Transitions ─────────────────────────────────────────────────────────────
export const standardTransition: Transition = {
  duration: DURATION.standard,
  ease: EASING,
};

export const pageTransition: Transition = {
  duration: DURATION.page,
  ease: EASING,
};

// ─── Variants ────────────────────────────────────────────────────────────────

/** Fade-in with subtle upward movement. For individual elements. */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: standardTransition,
  },
};

/** Container that orchestrates staggered children reveal. */
export const staggerContainer: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

/** Child variant for use inside a staggerContainer. */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: standardTransition,
  },
};

/** Fade-in only (no translate). Useful for overlays and modals. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: DURATION.standard,
      ease: EASING,
    },
  },
};

/** Scale-in from slightly smaller. For cards and floating elements. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: standardTransition,
  },
};

// ─── Reduced motion helpers ──────────────────────────────────────────────────

/** Returns neutral (no-op) motion props when user prefers reduced motion. */
export function getMotionProps(prefersReducedMotion: boolean | null) {
  if (prefersReducedMotion) {
    return {
      initial: undefined,
      animate: undefined,
      transition: undefined,
    };
  }
  return {
    initial: "hidden" as const,
    animate: "visible" as const,
  };
}
