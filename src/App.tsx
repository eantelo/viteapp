import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import React, { lazy, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { FEATURES } from "@/lib/features";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { Toaster } from "@/components/ui/sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapTrifold } from "@phosphor-icons/react";

const DashboardPage = lazy(() => import("@/pages/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const ProductCatalogPage = lazy(() => import("@/pages/ProductCatalogPage").then((module) => ({ default: module.ProductCatalogPage })));
const ProductDetailPage = lazy(() => import("@/pages/ProductDetailPage").then((module) => ({ default: module.ProductDetailPage })));
const ProductUpsertPage = lazy(() => import("@/pages/ProductUpsertPage").then((module) => ({ default: module.ProductUpsertPage })));
const CategoriesPage = lazy(() => import("@/pages/CategoriesPage").then((module) => ({ default: module.CategoriesPage })));
const CustomersPage = lazy(() => import("@/pages/CustomersPage").then((module) => ({ default: module.CustomersPage })));
const SuppliersPage = lazy(() => import("@/pages/SuppliersPage").then((module) => ({ default: module.SuppliersPage })));
const SalesPage = lazy(() => import("@/pages/SalesPage").then((module) => ({ default: module.SalesPage })));
const SaleUpsertPage = lazy(() => import("@/pages/SaleUpsertPage").then((module) => ({ default: module.SaleUpsertPage })));
const PurchasesPage = lazy(() => import("@/pages/PurchasesPage").then((module) => ({ default: module.PurchasesPage })));
const PointOfSalePage = lazy(() => import("@/pages/PointOfSalePage").then((module) => ({ default: module.PointOfSalePage })));
const RestaurantPosPage = lazy(() => import("@/pages/RestaurantPosPage").then((module) => ({ default: module.RestaurantPosPage })));
const CrmPage = lazy(() => import("@/pages/CrmPage").then((module) => ({ default: module.CrmPage })));
const UsersPage = lazy(() => import("@/pages/UsersPage").then((module) => ({ default: module.UsersPage })));
const TenantSettingsPage = lazy(() => import("@/pages/settings/TenantSettingsPage").then((module) => ({ default: module.TenantSettingsPage })));
const SystemPage = lazy(() => import("@/pages/SystemPage").then((module) => ({ default: module.SystemPage })));
const WarehousesPage = lazy(() => import("@/pages/WarehousesPage").then((module) => ({ default: module.WarehousesPage })));
const WarehouseDetailPage = lazy(() => import("@/pages/WarehouseDetailPage").then((module) => ({ default: module.WarehouseDetailPage })));
const WarehouseTransfersPage = lazy(() => import("@/pages/WarehouseTransfersPage").then((module) => ({ default: module.WarehouseTransfersPage })));

interface RouteStateProps {
  authenticated?: boolean;
  eyebrow: string;
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
}

function RouteState({
  authenticated = false,
  eyebrow,
  title,
  description,
  primaryHref,
  primaryLabel,
}: RouteStateProps) {
  const content = (
    <section
      className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center py-10 sm:py-16"
      aria-labelledby="route-state-title"
    >
      <div className="w-full rounded-2xl border border-border/70 bg-card p-6 text-center shadow-sm sm:p-10">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MapTrifold
            className="size-7"
            weight="duotone"
            aria-hidden="true"
          />
        </div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          {eyebrow}
        </p>
        <h1
          id="route-state-title"
          className="mt-2 text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
        <Button asChild className="mt-7">
          <Link to={primaryHref}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            {primaryLabel}
          </Link>
        </Button>
      </div>
    </section>
  );

  if (authenticated) {
    return (
      <DashboardLayout
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: eyebrow },
        ]}
      >
        {content}
      </DashboardLayout>
    );
  }

  return (
    <main
      id="contenido-principal"
      tabIndex={-1}
      className="flex min-h-screen bg-muted/30 px-4 py-8 text-foreground sm:px-6"
    >
      {content}
    </main>
  );
}

interface FeatureRouteProps {
  feature: string;
  featureName: string;
  children: React.ReactNode;
}

function FeatureRoute({
  feature,
  featureName,
  children,
}: FeatureRouteProps) {
  const { hasFeature } = useAuth();
  if (!hasFeature(feature)) {
    return (
      <RouteState
        authenticated
        eyebrow="Módulo no disponible"
        title={`${featureName} no está habilitado`}
        description="Tu empresa no tiene acceso a esta función. Puedes continuar trabajando desde el inicio o solicitar acceso al administrador de tu cuenta."
        primaryHref="/dashboard"
        primaryLabel="Volver al inicio"
      />
    );
  }
  return <>{children}</>;
}

function RouteLoadingState() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card px-5 py-4 shadow-sm">
        <span
          className="size-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary motion-reduce:animate-none"
          aria-hidden="true"
        />
        <span className="text-sm font-medium">Cargando vista…</span>
      </div>
    </div>
  );
}

function NotFoundRoute() {
  const { isAuthenticated } = useAuth();

  return (
    <RouteState
      authenticated={isAuthenticated}
      eyebrow="Error 404"
      title="No encontramos esta página"
      description="La dirección puede haber cambiado o ya no estar disponible. Regresa a un lugar conocido para continuar."
      primaryHref={isAuthenticated ? "/dashboard" : "/"}
      primaryLabel={
        isAuthenticated ? "Volver al inicio" : "Ir a la página principal"
      }
    />
  );
}

function App() {
  const location = useLocation();

  return (
    <>
      <Suspense fallback={<RouteLoadingState />}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/sales" element={<SalesPage />} />
          <Route path="/sales/new" element={<SaleUpsertPage />} />
          <Route path="/sales/:id/edit" element={<SaleUpsertPage />} />
          <Route path="/pos" element={<PointOfSalePage />} />
          <Route path="/pos/restaurant" element={<RestaurantPosPage />} />
          <Route path="/products" element={<ProductCatalogPage />} />
          <Route path="/products/new" element={<ProductUpsertPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/products/:id/edit" element={<ProductUpsertPage />} />
          <Route
            path="/catalog"
            element={<Navigate to="/products" replace />}
          />
          <Route path="/categories" element={<FeatureRoute feature={FEATURES.CATEGORIES} featureName="Categorías"><CategoriesPage /></FeatureRoute>} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/suppliers" element={<FeatureRoute feature={FEATURES.SUPPLIERS} featureName="Proveedores"><SuppliersPage /></FeatureRoute>} />
          <Route path="/purchases" element={<FeatureRoute feature={FEATURES.PURCHASES} featureName="Compras"><PurchasesPage /></FeatureRoute>} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/crm" element={<FeatureRoute feature={FEATURES.CRM} featureName="CRM"><CrmPage /></FeatureRoute>} />
          <Route path="/warehouses" element={<WarehousesPage />} />
          <Route path="/warehouses/:id" element={<WarehouseDetailPage />} />
          <Route
            path="/warehouse-transfers"
            element={<WarehouseTransfersPage />}
          />
          <Route path="/settings" element={<TenantSettingsPage />} />
          <Route path="/system" element={<SystemPage />} />
        </Route>
        <Route path="*" element={<NotFoundRoute />} />
      </Routes>
      </Suspense>
      <Toaster />
    </>
  );
}

export default App;
