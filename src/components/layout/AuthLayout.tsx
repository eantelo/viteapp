import { useId, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, ShieldCheck } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

const benefits = [
  "Ventas, inventario y clientes conectados",
  "Acceso organizado para cada equipo",
  "Una experiencia clara en cualquier pantalla",
];

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  className,
}: AuthLayoutProps) {
  const titleId = useId();
  const shouldReduceMotion = useReducedMotion();

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-muted/40 px-4 py-8 sm:px-6 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-[-5rem] size-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-32 right-[-6rem] size-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/10 to-background/50" />
      </div>

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.4, ease: "easeOut" }}
        className={cn(
          "relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border/70 bg-card shadow-2xl shadow-black/10 lg:grid-cols-[0.92fr_1.08fr]",
          className,
        )}
      >
        <aside className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:min-h-[42rem] lg:flex-col lg:justify-between xl:p-12">
          <div aria-hidden="true" className="absolute inset-0">
            <div className="absolute -right-24 -top-24 size-72 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-16 -left-16 size-64 rounded-full bg-black/10 blur-2xl" />
          </div>

          <Link
            to="/"
            aria-label="SalesNet, volver al inicio"
            className="relative inline-flex w-fit items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-xl bg-white/15 text-xl font-bold ring-1 ring-white/20">
              S
            </span>
            <span className="text-xl font-bold tracking-tight" translate="no">
              SalesNet
            </span>
          </Link>

          <div className="relative space-y-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground/75">
                Tu operación, conectada
              </p>
              <p className="mt-4 max-w-sm text-pretty text-3xl font-semibold leading-tight xl:text-4xl">
                Entra y continúa donde tu equipo dejó el trabajo.
              </p>
            </div>

            <ul className="space-y-4 text-sm text-primary-foreground/85">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <CheckCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0" weight="fill" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-primary-foreground/85 backdrop-blur-sm">
            <ShieldCheck aria-hidden="true" className="size-6 shrink-0" weight="duotone" />
            <span>Acceso reservado para usuarios autorizados.</span>
          </div>
        </aside>

        <section aria-labelledby={titleId} className="flex min-w-0 flex-col bg-card p-5 sm:p-8 lg:p-10 xl:p-12">
          <Link
            to="/"
            aria-label="SalesNet, volver al inicio"
            className="mb-8 inline-flex w-fit items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:hidden"
          >
            <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
              S
            </span>
            <span className="text-lg font-bold tracking-tight" translate="no">
              SalesNet
            </span>
          </Link>

          <Card className="flex flex-1 flex-col justify-center border-0 bg-transparent shadow-none">
            <CardHeader className="space-y-2 px-0 pb-7 pt-0 text-left">
              <h1 id={titleId} className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
                {title}
              </h1>
              {subtitle && <p className="text-pretty text-sm leading-6 text-muted-foreground sm:text-base">{subtitle}</p>}
            </CardHeader>
            <CardContent className="px-0">{children}</CardContent>
            {footer && (
              <CardFooter className="mt-7 justify-center border-t border-border px-0 pb-0 pt-6 text-center text-sm text-muted-foreground">
                {footer}
              </CardFooter>
            )}
          </Card>
        </section>
      </motion.div>
    </main>
  );
}
