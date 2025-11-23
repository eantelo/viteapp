import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { authApi } from "@/api/authApi";
import type { ApiError } from "@/api/apiClient";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { PageTransition } from "@/components/motion/PageTransition";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { validateEmail } from "@/lib/validation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/Spinner";
import { Mail, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function ForgotPasswordPage() {
  useDocumentTitle("SalesNet | Recuperar contraseña");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setEmailError(undefined);

    const emailValidation = validateEmail(email);
    if (emailValidation) {
      setEmailError(emailValidation);
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.forgotPassword({ email });
      setSuccessMessage(
        response.message || "Si el correo existe, recibirás un enlace para restablecer tu contraseña."
      );
      setEmail("");
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(
        apiError.message ?? "Ocurrió un error al procesar tu solicitud"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <AuthLayout
        title="Recuperar contraseña"
        subtitle="Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña"
        footer={
          <div className="text-muted-foreground">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 font-semibold text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        }
      >
        <div className="grid gap-6">
          {errorMessage && (
            <Alert variant="error" message={errorMessage} />
          )}
          {successMessage && (
            <Alert variant="success" message={successMessage} />
          )}
          
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="nombre@empresa.com"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setEmailError(undefined);
                    }}
                    className={cn(
                      "pl-9",
                      emailError && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                </div>
                {emailError && (
                  <p className="text-sm text-red-500">{emailError}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Spinner size="sm" className="mr-2 text-current" />}
                {isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
              </Button>
            </div>
          </form>
        </div>
      </AuthLayout>
    </PageTransition>
  );
}
