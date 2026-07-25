import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authApi } from "@/api/authApi";
import type { ApiError } from "@/api/apiClient";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { PageTransition } from "@/components/motion/PageTransition";
import { LoginForm } from "@/components/login-form";
import { useAuth } from "@/context/AuthContext";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { extractProblemDetails } from "@/lib/errors";
import { validateEmail, validatePassword } from "@/lib/validation";
import {
  decodeRequestOptions,
  describePasskeyError,
  isPasskeySupported,
  serializeCredential,
} from "@/lib/passkeys";
import { Button } from "@/components/ui/button";
import { Fingerprint, ShieldCheck } from "@phosphor-icons/react";

type LoginField = "email" | "password";

type LoginFieldErrors = Partial<Record<LoginField, string>>;

export function LoginPage() {
  useDocumentTitle("SalesNet | Iniciar sesión");
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuth();
  const [formState, setFormState] = useState({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [showPasskeyInvite, setShowPasskeyInvite] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [successMessage] = useState<string | null>(
    (location.state as { message?: string })?.message || null
  );

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
      setShowPasskeyInvite(isPasskeySupported());
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

  const handlePasskeyLogin = async () => {
    setErrorMessage(null);
    setErrorDetails([]);
    setIsPasskeyLoading(true);
    try {
      const options = await authApi.beginPasskeyAuthentication();
      const credential = await navigator.credentials.get({
        publicKey: decodeRequestOptions(
          options.publicKey as PublicKeyCredentialRequestOptions,
        ),
      });
      if (!(credential instanceof PublicKeyCredential)) {
        throw new Error("El navegador no devolvió una credencial válida.");
      }
      const response = await authApi.completePasskeyAuthentication(
        options.ceremonyId,
        serializeCredential(credential),
      );
      setAuth(response);
      navigate("/dashboard");
    } catch (error) {
      setErrorMessage(describePasskeyError(error));
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  if (showPasskeyInvite) {
    return (
      <AuthLayout
        title="Protege tu cuenta"
        subtitle="Activa una passkey para ingresar con tu teléfono"
      >
        <div className="grid gap-5 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="size-7" weight="duotone" aria-hidden="true" />
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            En el próximo acceso podrás escanear un QR y aprobar con huella,
            rostro o el desbloqueo seguro de tu teléfono.
          </p>
          <Button onClick={() => navigate("/account/security", { state: { autoEnroll: true } })}>
            <Fingerprint className="size-5" weight="duotone" aria-hidden="true" />
            Activar passkey
          </Button>
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            Ahora no
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <PageTransition>
      <AuthLayout
        title="Inicia sesión"
        subtitle="Bienvenido de vuelta a SalesNet"
        footer={
          <div className="text-muted-foreground">
            ¿Aún no tienes cuenta?{" "}
            <Link
              to="/register"
              className="font-semibold text-primary hover:underline"
            >
              Crear cuenta
            </Link>
          </div>
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
          successMessage={successMessage}
          isLoading={isLoading}
          isPasskeyLoading={isPasskeyLoading}
          isPasskeySupported={isPasskeySupported()}
          onSubmit={handleSubmit}
          onEmailChange={(value) => handleChange("email", value)}
          onPasswordChange={(value) => handleChange("password", value)}
          onTogglePassword={() => setShowPassword((prev) => !prev)}
          onRememberDeviceChange={(value) => setRememberDevice(value)}
          onPasskeyLogin={handlePasskeyLogin}
        />
      </AuthLayout>
    </PageTransition>
  );
}
