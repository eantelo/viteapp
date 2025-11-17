import { useId, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "@/api/authApi";
import type { ApiError } from "@/api/apiClient";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { PageTransition } from "@/components/motion/PageTransition";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { extractProblemDetails } from "@/lib/errors";
import {
  validateEmail,
  validatePassword,
  validateTenantCode,
} from "@/lib/validation";

type RegisterField = "tenantCode" | "email" | "password";
type RegisterFieldErrors = Partial<Record<RegisterField, string>>;

export function RegisterPage() {
  useDocumentTitle("SalesNet | Crear cuenta");
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const tenantInputId = useId();
  const emailInputId = useId();
  const passwordInputId = useId();
  const [formState, setFormState] = useState({
    tenantCode: "",
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: RegisterField, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateForm = (): boolean => {
    const nextErrors: RegisterFieldErrors = {};
    const tenantError = validateTenantCode(formState.tenantCode);
    const emailError = validateEmail(formState.email);
    const passwordError = validatePassword(formState.password);

    if (tenantError) {
      nextErrors.tenantCode = tenantError;
    }
    if (emailError) {
      nextErrors.email = emailError;
    }
    if (passwordError) {
      nextErrors.password = passwordError;
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setErrorDetails([]);
    setIsLoading(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.register(formState);
      setAuth(response);
      navigate("/dashboard");
    } catch (error) {
      const apiError = error as ApiError;
      const { fieldErrors: serverFieldErrors, generalErrors } =
        extractProblemDetails<RegisterField>(apiError.details, [
          "tenantCode",
          "email",
          "password",
        ]);
      if (Object.keys(serverFieldErrors).length > 0) {
        setFieldErrors((prev) => ({ ...prev, ...serverFieldErrors }));
      }
      if (generalErrors.length > 0) {
        setErrorDetails(generalErrors);
      }
      setErrorMessage(apiError.message ?? "No pudimos crear la cuenta");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <AuthLayout
        title="Crear una cuenta"
        subtitle="Registra un tenant y tu primer usuario administrador"
        footer={
          <CardFooter>
            ¿Ya tienes credenciales?{" "}
            <Link to="/login" className="font-semibold text-blue-600">
              Inicia sesión
            </Link>
          </CardFooter>
        }
      >
        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          {errorMessage && (
            <Alert
              variant="error"
              message={errorMessage}
              items={errorDetails}
            />
          )}
          <div className="space-y-2">
            <Label htmlFor={tenantInputId}>
              Código del tenant <span className="text-red-500">*</span>
            </Label>
            <Input
              id={tenantInputId}
              name="tenantCode"
              placeholder="mi-empresa"
              value={formState.tenantCode}
              onChange={(event) =>
                handleChange("tenantCode", event.target.value)
              }
              required
              aria-invalid={Boolean(fieldErrors.tenantCode)}
              aria-describedby={
                fieldErrors.tenantCode ? `${tenantInputId}-error` : undefined
              }
            />
            <p className="text-sm text-slate-500">
              Identificador único para tu organización
            </p>
            {fieldErrors.tenantCode && (
              <p id={`${tenantInputId}-error`} className="text-sm text-red-600">
                {fieldErrors.tenantCode}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={emailInputId}>
              Correo corporativo <span className="text-red-500">*</span>
            </Label>
            <Input
              id={emailInputId}
              name="email"
              type="email"
              placeholder="founder@miempresa.com"
              autoComplete="email"
              value={formState.email}
              onChange={(event) => handleChange("email", event.target.value)}
              required
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={
                fieldErrors.email ? `${emailInputId}-error` : undefined
              }
            />
            {fieldErrors.email && (
              <p id={`${emailInputId}-error`} className="text-sm text-red-600">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={passwordInputId}>
              Contraseña <span className="text-red-500">*</span>
            </Label>
            <Input
              id={passwordInputId}
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              value={formState.password}
              onChange={(event) => handleChange("password", event.target.value)}
              required
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={
                fieldErrors.password ? `${passwordInputId}-error` : undefined
              }
            />
            {fieldErrors.password && (
              <p
                id={`${passwordInputId}-error`}
                className="text-sm text-red-600"
              >
                {fieldErrors.password}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Spinner size="sm" className="text-current" />}
            {isLoading ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
          <p className="text-center text-xs text-slate-500">
            Al continuar aceptas los términos del servicio y reconoces las
            políticas de privacidad del tenant.
          </p>
        </form>
      </AuthLayout>
    </PageTransition>
  );
}
