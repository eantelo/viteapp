import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "@/api/authApi";
import type { ApiError } from "@/api/apiClient";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { LoginForm } from "@/components/login-form";
import { CardFooter } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { extractProblemDetails } from "@/lib/errors";
import { validateEmail, validatePassword } from "@/lib/validation";

type LoginField = "email" | "password";

type LoginFieldErrors = Partial<Record<LoginField, string>>;

export function LoginPage() {
  useDocumentTitle("SalesNet | Iniciar sesión");
  const navigate = useNavigate();
  const { setAuth } = useAuth();
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
      <LoginForm
        email={formState.email}
        password={formState.password}
        rememberDevice={rememberDevice}
        showPassword={showPassword}
        fieldErrors={fieldErrors}
        errorMessage={errorMessage}
        errorDetails={errorDetails}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        onEmailChange={(value) => handleChange("email", value)}
        onPasswordChange={(value) => handleChange("password", value)}
        onTogglePassword={() => setShowPassword((prev) => !prev)}
        onRememberDeviceChange={(value) => setRememberDevice(value)}
      />
    </AuthLayout>
  );
}
