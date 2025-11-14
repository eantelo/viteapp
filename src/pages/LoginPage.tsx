import { useId, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "@/api/authApi";
import type { ApiError } from "@/api/apiClient";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { extractProblemDetails } from "@/lib/errors";
import { validateEmail, validatePassword } from "@/lib/validation";
import { Eye, EyeOff } from "lucide-react";

type LoginField = "email" | "password";

type LoginFieldErrors = Partial<Record<LoginField, string>>;

export function LoginPage() {
  useDocumentTitle("SalesNet | Iniciar sesión");
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const emailInputId = useId();
  const passwordInputId = useId();
  const [formState, setFormState] = useState({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);

  const handleChange = (field: LoginField, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateForm = (): boolean => {
    const nextErrors: LoginFieldErrors = {};
    const emailError = validateEmail(formState.email);
    const passwordError = validatePassword(formState.password);
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
      const response = await authApi.login(formState);
      setAuth(response);
      navigate("/dashboard");
    } catch (error) {
      const apiError = error as ApiError;
      const { fieldErrors: serverFieldErrors, generalErrors } =
        extractProblemDetails<LoginField>(apiError.details, [
          "email",
          "password",
        ]);
      if (Object.keys(serverFieldErrors).length > 0) {
        setFieldErrors((prev) => ({ ...prev, ...serverFieldErrors }));
      }
      if (generalErrors.length > 0) {
        setErrorDetails(generalErrors);
      }
      setErrorMessage(
        apiError.message ?? "No pudimos validar tus credenciales"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Inicia sesión"
      subtitle="Bienvenido de vuelta a SalesNet"
      footer={
        <CardFooter>
          ¿Aún no tienes cuenta?{" "}
          <Link to="/register" className="font-semibold text-blue-600">
            Crear cuenta
          </Link>
        </CardFooter>
      }
    >
      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        {errorMessage && (
          <Alert variant="error" message={errorMessage} items={errorDetails} />
        )}

        <div className="space-y-2">
          <Label htmlFor={emailInputId}>
            Correo electrónico <span className="text-red-500">*</span>
          </Label>
          <Input
            id={emailInputId}
            name="email"
            type="email"
            placeholder="admin@tuempresa.com"
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
          <div className="flex items-center justify-between">
            <Label htmlFor={passwordInputId}>
              Contraseña <span className="text-red-500">*</span>
            </Label>
            <button
              type="button"
              className="text-xs font-semibold text-blue-600 transition hover:text-blue-500"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>
          <div className="relative">
            <Input
              id={passwordInputId}
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              value={formState.password}
              onChange={(event) => handleChange("password", event.target.value)}
              required
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={
                fieldErrors.password ? `${passwordInputId}-error` : undefined
              }
              className="pr-12"
            />
            <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
          </div>
          {fieldErrors.password && (
            <p id={`${passwordInputId}-error`} className="text-sm text-red-600">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-slate-600">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(event) => setRememberDevice(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-700 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            />
            Recordar este dispositivo
          </label>
          <span className="text-blue-600">
            ¿Olvidaste tu contraseña? Contacta al administrador del tenant.
          </span>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Spinner size="sm" className="text-current" />}
          {isLoading ? "Accediendo..." : "Acceder"}
        </Button>
      </form>
    </AuthLayout>
  );
}
