import { Navigate, Route, Routes, useLocation } from "react-router-dom";
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

function FeatureRoute({ feature, children }: { feature: string; children: React.ReactNode }) {
  const { hasFeature } = useAuth();
  if (!hasFeature(feature)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function App() {
  const location = useLocation();

  return (
    <>
      <Suspense fallback={<div className="min-h-screen bg-background" aria-busy="true" />}>
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
          <Route path="/categories" element={<FeatureRoute feature={FEATURES.CATEGORIES}><CategoriesPage /></FeatureRoute>} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/suppliers" element={<FeatureRoute feature={FEATURES.SUPPLIERS}><SuppliersPage /></FeatureRoute>} />
          <Route path="/purchases" element={<FeatureRoute feature={FEATURES.PURCHASES}><PurchasesPage /></FeatureRoute>} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/crm" element={<FeatureRoute feature={FEATURES.CRM}><CrmPage /></FeatureRoute>} />
          <Route path="/warehouses" element={<WarehousesPage />} />
          <Route path="/warehouses/:id" element={<WarehouseDetailPage />} />
          <Route
            path="/warehouse-transfers"
            element={<WarehouseTransfersPage />}
          />
          <Route path="/settings" element={<TenantSettingsPage />} />
          <Route path="/system" element={<SystemPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
      <Toaster />
    </>
  );
}

export default App;
