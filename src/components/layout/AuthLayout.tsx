import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  highlight?: string;
  className?: string;
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  highlight = "SalesNet Platform",
  className,
}: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-6 py-12 md:flex-row md:items-center">
        <section className="flex-1 space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.6em] text-blue-200">
            {highlight}
          </p>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
              El punto de partida para tus ventas multitenant
            </h1>
            <p className="text-base text-slate-300">
              Gestiona usuarios, tenants y sesiones seguras desde un solo lugar.
              Conecta con Sales.Api para acceder a reportes en tiempo real,
              inventarios y flujo de ventas.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200 backdrop-blur">
            <p className="font-semibold text-white">Beneficios clave</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-200">
              <li>Autenticación con JWT y refresh tokens</li>
              <li>Seguridad multitenant lista para producción</li>
              <li>Escala global con Azure Cosmos DB o PostgreSQL</li>
            </ul>
          </div>
        </section>
        <section className={cn("flex-1", className)}>
          <Card className="bg-white/95 shadow-2xl">
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              {subtitle && <CardDescription>{subtitle}</CardDescription>}
            </CardHeader>
            <CardContent>{children}</CardContent>
            {footer}
          </Card>
        </section>
      </div>
    </main>
  );
}
