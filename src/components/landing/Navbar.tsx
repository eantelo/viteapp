import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import { List, X } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";

const navigationFocus =
  "rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const mobileMenuId = useId();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <motion.nav
      aria-label="Navegación principal"
      initial={shouldReduceMotion ? false : { y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.35, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/90 shadow-sm shadow-black/5 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75"
    >
      <a
        href="#main-content"
        className="absolute left-4 top-2 z-[60] -translate-y-20 rounded-md bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-lg transition-transform focus-visible:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Saltar al contenido
      </a>

      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4 sm:h-[4.5rem] sm:px-6">
        <Link
          to="/"
          aria-label="SalesNet, ir al inicio"
          className={`flex shrink-0 items-center gap-2.5 ${navigationFocus}`}
          onClick={closeMenu}
        >
          <span
            aria-hidden="true"
            className="flex size-9 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-sm shadow-primary/25"
          >
            S
          </span>
          <span className="text-lg font-bold tracking-tight sm:text-xl" translate="no">
            SalesNet
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className={`px-1 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground ${navigationFocus}`}
          >
            Funcionalidades
          </a>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" size="sm" className="transition-colors">
            <Link to="/login">Iniciar sesión</Link>
          </Button>
          <Button asChild size="sm" className="rounded-full px-5 transition-colors">
            <Link to="/register">Crear cuenta</Link>
          </Button>
        </div>

        <button
          type="button"
          aria-label={isMenuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
          aria-expanded={isMenuOpen}
          aria-controls={mobileMenuId}
          className="inline-flex size-11 items-center justify-center rounded-xl border border-border bg-background text-foreground shadow-xs transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:hidden"
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
        >
          {isMenuOpen ? (
            <X aria-hidden="true" className="size-5" weight="bold" />
          ) : (
            <List aria-hidden="true" className="size-5" weight="bold" />
          )}
        </button>
      </div>

      {isMenuOpen && (
        <motion.div
          id={mobileMenuId}
          initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
          className="border-t border-border/70 bg-background/98 px-4 py-4 shadow-lg md:hidden"
        >
          <div className="container mx-auto grid gap-2">
            <a
              href="#features"
              className={`rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent ${navigationFocus}`}
              onClick={closeMenu}
            >
              Funcionalidades
            </a>
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-4">
              <Button asChild variant="outline" className="h-11 transition-colors">
                <Link to="/login" onClick={closeMenu}>
                  Iniciar sesión
                </Link>
              </Button>
              <Button asChild className="h-11 transition-colors">
                <Link to="/register" onClick={closeMenu}>
                  Crear cuenta
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
