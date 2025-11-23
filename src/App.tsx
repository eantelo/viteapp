
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { DashboardPage } from "@/pages/DashboardPage";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { ProductsPage } from "@/pages/ProductsPage";
import { ProductCatalogPage } from "@/pages/ProductCatalogPage";
import { CustomersPage } from "@/pages/CustomersPage";
import { SalesPage } from "@/pages/SalesPage";
import { SalesHistoryPage } from "@/pages/SalesHistoryPage";
import { PointOfSalePage } from "@/pages/PointOfSalePage";
import { RestaurantPosPage } from "@/pages/RestaurantPosPage";
import { TenantSettingsPage } from "@/pages/settings/TenantSettingsPage";
import { SystemPage } from "@/pages/SystemPage";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { Toaster } from "@/components/ui/sonner";

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
          <Route path="/sales/history" element={<SalesHistoryPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/pos" element={<PointOfSalePage />} />
          <Route path="/pos/restaurant" element={<RestaurantPosPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/catalog" element={<ProductCatalogPage />} />
          <Route path="/customers" element={<CustomersPage />} />
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
