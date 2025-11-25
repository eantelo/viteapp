import { useState } from "react";
import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { SetupWizard } from "@/components/setup-wizard";

interface ProtectedRouteProps {
  children?: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, auth } = useAuth();
  const location = useLocation();
  const [wizardDismissed, setWizardDismissed] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Show setup wizard for Admin users who haven't completed setup
  const shouldShowWizard =
    auth &&
    auth.role === "Admin" &&
    !auth.isSetupComplete &&
    !wizardDismissed &&
    location.pathname !== "/settings";

  return (
    <>
      {shouldShowWizard && (
        <SetupWizard open={true} onComplete={() => setWizardDismissed(true)} />
      )}
      {children ?? <Outlet />}
    </>
  );
}
