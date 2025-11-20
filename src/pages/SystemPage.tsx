import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageTransition } from "@/components/motion/PageTransition";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { Laptop, Shield, Key } from "lucide-react";

type StatCard = {
  label: string;
  value: ReactNode;
  helper?: string;
  icon?: ReactNode;
};

type TokenDetail = {
  label: string;
  value?: string | null;
  isSecret?: boolean;
};

export function SystemPage() {
  useDocumentTitle("SalesNet | Sistema");
  const { auth, refreshSession, isRefreshing, refreshError, lastRefreshAt } =
    useAuth();
  const prefersReducedMotion = useReducedMotion();
  const defaultEase: [number, number, number, number] = [0.16, 1, 0.3, 1];
  const fadeInInitial = prefersReducedMotion
    ? { opacity: 1, y: 0 }
    : { opacity: 0, y: 16 };
  const fadeInAnimate = { opacity: 1, y: 0 };

  const [manualMessage, setManualMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!refreshError) {
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setManualMessage(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [refreshError]);

  const lastRefreshLabel = lastRefreshAt
    ? new Intl.DateTimeFormat("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(lastRefreshAt))
    : "Pendiente";

  const statusLabel = refreshError ? "Atención requerida" : "Sesión activa";
  const statusVariant = refreshError ? "destructive" : "secondary";

  const sessionStats: StatCard[] = [
    {
      label: "Correo principal",
      value: auth?.email ?? "Usuario sin correo",
      helper: "Claim email emitido por Sales.Api",
      icon: <Shield className="h-4 w-4 text-muted-foreground" />,
    },
    {
      label: "Rol asignado",
      value: <Badge variant="outline">{auth?.role ?? "Sin rol"}</Badge>,
      helper: "Controla la UI disponible para el usuario",
      icon: <Key className="h-4 w-4 text-muted-foreground" />,
    },
    {
      label: "Tenant actual",
      value: auth?.tenantId ?? "Sin tenant",
      helper: "Claim tenant utilizado para multitenancy",
      icon: <Laptop className="h-4 w-4 text-muted-foreground" />,
    },
    {
      label: "Última renovación",
      value: lastRefreshLabel,
      helper: isRefreshing
        ? "Renovando..."
        : lastRefreshAt
        ? "Autorenovación en curso"
        : "Pendiente de primer refresh",
    },
  ];

  const tokenDetails: TokenDetail[] = [
    { label: "Tenant ID", value: auth?.tenantId },
    { label: "User ID", value: auth?.userId },
    { label: "Access token", value: auth?.token, isSecret: true },
    { label: "Refresh token", value: auth?.refreshToken, isSecret: true },
  ];

  const handleManualRefresh = async () => {
    setManualMessage(null);
    try {
      const result = await refreshSession();
      if (result) {
        setManualMessage("Sesión renovada correctamente");
      }
    } catch (error) {
      console.error("Manual refresh failed", error);
    }
  };

  return (
    <PageTransition>
      <DashboardLayout
        breadcrumbs={[
          { label: "Panel principal", href: "/dashboard" },
          { label: "Sistema" },
        ]}
        className="flex flex-1 flex-col gap-4 p-4 pt-0"
      >
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {sessionStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={fadeInInitial}
              animate={fadeInAnimate}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.4,
                delay: prefersReducedMotion ? 0 : index * 0.08,
                ease: defaultEase,
              }}
            >
              <Card className="bg-card shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                  </CardDescription>
                  {stat.icon}
                </CardHeader>
                <CardContent>
                  <div className="text-base font-medium text-card-foreground">
                    {stat.value}
                  </div>
                  {stat.helper && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {stat.helper}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>
        <motion.section
          className="grid gap-4 lg:grid-cols-[2fr,1fr]"
          initial={fadeInInitial}
          animate={fadeInAnimate}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.45,
            ease: defaultEase,
          }}
        >
          <Card className="bg-card shadow-sm">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle>Sesión autenticada</CardTitle>
                <Badge variant={statusVariant}>{statusLabel}</Badge>
              </div>
              <CardDescription>
                Tokens generados por Sales.Api tras el flujo de login o
                registro.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(refreshError || manualMessage) && (
                <Alert
                  variant={refreshError ? "error" : "success"}
                  message={refreshError ?? manualMessage ?? ""}
                />
              )}
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Última renovación
                  </p>
                  <p className="text-2xl font-semibold text-card-foreground">
                    {lastRefreshLabel}
                  </p>
                </div>
                <Button onClick={handleManualRefresh} disabled={isRefreshing}>
                  {isRefreshing && (
                    <Spinner size="sm" className="text-current" />
                  )}
                  {isRefreshing ? "Renovando..." : "Renovar ahora"}
                </Button>
              </div>
              <dl className="grid gap-4 md:grid-cols-2">
                {tokenDetails.map((detail) => (
                  <div
                    key={detail.label}
                    className="rounded-xl border border-border bg-muted/50 p-4"
                  >
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      {detail.label}
                    </dt>
                    <dd
                      className={cn(
                        "text-sm font-mono text-card-foreground",
                        detail.isSecret &&
                          "break-all text-xs text-muted-foreground sm:text-[13px]"
                      )}
                    >
                      {detail.value ?? "—"}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="rounded-xl border border-dashed border-primary/40 bg-primary/10 px-4 py-3 text-sm text-foreground">
                <p className="font-semibold">
                  Buenas prácticas para tokens
                </p>
                <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                  <li>Persistir tokens en almacenamiento seguro.</li>
                  <li>
                    Invocar <code>/api/auth/refresh-token</code> antes de la
                    expiración.
                  </li>
                  <li>Revocar el refresh token siempre que cierres sesión.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card shadow-sm">
            <CardHeader>
              <CardTitle>Estado del dispositivo</CardTitle>
              <CardDescription>
                Diagnósticos rápidos para tu sesión multitenant.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs uppercase text-muted-foreground">Refresh</p>
                <p className="text-base font-semibold text-card-foreground">
                  {isRefreshing ? "Renovando" : "Programado"}
                </p>
                <p className="text-xs text-muted-foreground">
                  El contexto renueva el JWT un minuto antes de expirar.
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs uppercase text-muted-foreground">
                  Autenticación
                </p>
                <p className="text-base font-semibold text-card-foreground">
                  {auth ? "Activa" : "Sin sesión"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Claims `tenant`, `sub` y `role` aplican aislamiento por
                  tenant.
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs uppercase text-muted-foreground">Pro tips</p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs">
                  <li>Copia los tokens solo en entornos seguros.</li>
                  <li>Monitorea fallos de refresh en tus logs.</li>
                  <li>Audita accesos sospechosos por tenant.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </DashboardLayout>
    </PageTransition>
  );
}
