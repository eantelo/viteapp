import { Link } from "react-router-dom";
import { ArrowRight, ChartBar, Globe, Shield } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";

const valuePoints = [
  "Información centralizada",
  "Acceso organizado por roles",
  "Experiencia adaptable",
];

export function Hero() {
  const shouldReduceMotion = useReducedMotion();

  const transition = (delay: number, duration = 0.5) => ({
    duration: shouldReduceMotion ? 0 : duration,
    delay: shouldReduceMotion ? 0 : delay,
    ease: "easeOut" as const,
  });

  return (
    <section
      id="main-content"
      tabIndex={-1}
      aria-labelledby="hero-title"
      className="relative scroll-mt-20 overflow-hidden pb-20 pt-28 outline-none sm:pt-32 lg:pb-28 lg:pt-44"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 mx-auto max-w-7xl">
        <div className="absolute left-[-6rem] top-24 size-72 rounded-full bg-primary/20 opacity-40 blur-3xl motion-safe:animate-pulse sm:left-10" />
        <div className="absolute bottom-10 right-[-8rem] size-96 rounded-full bg-blue-500/15 opacity-40 blur-3xl sm:right-10" />
        <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-primary/5 to-transparent" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transition(0)}
          >
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm sm:text-sm">
              <span aria-hidden="true" className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              ERP multitenant para equipos comerciales
            </span>
          </motion.div>

          <motion.h1
            id="hero-title"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transition(0.08)}
            className="max-w-4xl text-balance bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl lg:text-7xl"
          >
              Gestiona tu operación comercial{" "}
            <span className="mt-1 block text-primary">sin perder visibilidad</span>
          </motion.h1>

          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transition(0.16)}
            className="mt-6 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg md:text-xl md:leading-8"
          >
            Conecta ventas, productos, clientes, compras y almacenes en una sola experiencia preparada para el trabajo diario de tu equipo.
          </motion.p>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transition(0.24)}
            className="mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center"
          >
            <Button
              asChild
              size="lg"
              className="h-12 w-full rounded-full px-8 text-base shadow-lg shadow-primary/25 transition-transform motion-safe:hover:-translate-y-0.5 sm:w-auto"
            >
              <Link to="/register">
                Crear cuenta
                <ArrowRight aria-hidden="true" className="size-4" weight="bold" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 w-full rounded-full px-8 text-base transition-colors sm:w-auto"
            >
              <a href="#features">Explorar funcionalidades</a>
            </Button>
          </motion.div>

          <motion.ul
            aria-label="Beneficios principales"
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={transition(0.32)}
            className="mt-7 flex max-w-2xl flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground"
          >
            {valuePoints.map((valuePoint) => (
              <li key={valuePoint} className="inline-flex items-center gap-2">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
                {valuePoint}
              </li>
            ))}
          </motion.ul>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transition(0.38, 0.65)}
            className="relative mx-auto mt-14 w-full max-w-5xl sm:mt-20"
            aria-hidden="true"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-2xl shadow-black/10 backdrop-blur-sm sm:aspect-[16/9] lg:aspect-[21/9]">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-blue-500/5" />
              <div className="relative grid h-full grid-cols-[minmax(0,2fr)_minmax(5rem,1fr)] gap-3 p-4 sm:gap-5 sm:p-6">
                <div className="flex min-h-0 min-w-0 flex-col gap-3 sm:gap-4">
                  <div className="h-3 w-2/5 rounded-full bg-muted sm:h-5" />
                  <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-border/50 bg-muted/35">
                    <ChartBar className="size-10 text-primary/55 sm:size-14" weight="duotone" />
                  </div>
                </div>
                <div className="grid min-h-0 grid-rows-2 gap-3 sm:gap-4">
                  <div className="flex min-h-0 items-center justify-center rounded-xl border border-border/50 bg-muted/35">
                    <Globe className="size-7 text-muted-foreground/60 sm:size-9" weight="duotone" />
                  </div>
                  <div className="flex min-h-0 items-center justify-center rounded-xl border border-border/50 bg-muted/35">
                    <Shield className="size-7 text-muted-foreground/60 sm:size-9" weight="duotone" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
