import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { FEATURES } from "@/lib/features";
import { DashboardPage } from "@/pages/DashboardPage";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { ProductCatalogPage } from "@/pages/ProductCatalogPage";
import { ProductDetailPage } from "@/pages/ProductDetailPage";
import { ProductUpsertPage } from "@/pages/ProductUpsertPage";
import { CategoriesPage } from "@/pages/CategoriesPage";
import { CustomersPage } from "@/pages/CustomersPage";
import { SuppliersPage } from "@/pages/SuppliersPage";
import { SalesPage } from "@/pages/SalesPage";
import { SaleUpsertPage } from "@/pages/SaleUpsertPage";
import { PurchasesPage } from "@/pages/PurchasesPage";

import { PointOfSalePage } from "@/pages/PointOfSalePage";
import { RestaurantPosPage } from "@/pages/RestaurantPosPage";
import { CrmPage } from "@/pages/CrmPage";
import { UsersPage } from "@/pages/UsersPage";
import { TenantSettingsPage } from "@/pages/settings/TenantSettingsPage";
import { SystemPage } from "@/pages/SystemPage";
import { WarehousesPage } from "@/pages/WarehousesPage";
import { WarehouseDetailPage } from "@/pages/WarehouseDetailPage";
import { WarehouseTransfersPage } from "@/pages/WarehouseTransfersPage";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { Toaster } from "@/components/ui/sonner";

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
      <Toaster />
    </>
  );
}

export default App;
