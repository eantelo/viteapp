import { useId, type FormEventHandler } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

type LoginFormProps = {
  email: string;
  password: string;
  rememberDevice: boolean;
  showPassword: boolean;
  fieldErrors: Partial<Record<"email" | "password", string>>;
  errorMessage?: string | null;
  errorDetails?: string[];
  isLoading: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onRememberDeviceChange: (value: boolean) => void;
  className?: string;
};

export function LoginForm({
  email,
  password,
  rememberDevice,
  showPassword,
  fieldErrors,
  errorMessage,
  errorDetails,
  isLoading,
  onSubmit,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onRememberDeviceChange,
  className,
}: LoginFormProps) {
  const emailId = useId();
  const passwordId = useId();

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {errorMessage && (
        <Alert variant="error" message={errorMessage} items={errorDetails} />
      )}
      <form className="space-y-6" onSubmit={onSubmit} noValidate>
        <FieldGroup>
          <Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                variant="outline"
                type="button"
                className="h-auto gap-2 py-3 text-sm"
              >
                <AppleIcon className="h-4 w-4" />
                Continuar con Apple
              </Button>
              <Button
                variant="outline"
                type="button"
                className="h-auto gap-2 py-3 text-sm"
              >
                <GoogleIcon className="h-4 w-4" />
                Continuar con Google
              </Button>
            </div>
            <FieldDescription className="text-center text-xs">
              Próximamente activaremos SSO social. Por ahora utiliza tus
              credenciales de SalesNet.
            </FieldDescription>
          </Field>
          <FieldSeparator className="*:data-[slot=field-separator-content]:bg-background">
            O continúa con tus accesos
          </FieldSeparator>
          <Field>
            <FieldLabel htmlFor={emailId} className="text-sm">
              Correo electrónico
            </FieldLabel>
            <FieldContent>
              <Input
                id={emailId}
                name="email"
                type="email"
                placeholder="admin@tuempresa.com"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={
                  fieldErrors.email ? `${emailId}-error` : undefined
                }
              />
              <FieldError id={`${emailId}-error`}>
                {fieldErrors.email}
              </FieldError>
            </FieldContent>
          </Field>
          <Field>
            <div className="flex items-center gap-2">
              <FieldLabel htmlFor={passwordId} className="text-sm">
                Contraseña
              </FieldLabel>
              <button
                type="button"
                onClick={onTogglePassword}
                className="ml-auto text-xs font-semibold text-primary transition hover:text-primary/80"
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            <FieldContent>
              <div className="relative">
                <Input
                  id={passwordId}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={
                    fieldErrors.password ? `${passwordId}-error` : undefined
                  }
                  className="pr-12"
                />
                <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </span>
              </div>
              <FieldError id={`${passwordId}-error`}>
                {fieldErrors.password}
              </FieldError>
            </FieldContent>
          </Field>
          <Field orientation="horizontal" className="items-center">
            <FieldLabel className="text-sm text-muted-foreground">
              Recordar dispositivo
            </FieldLabel>
            <FieldContent>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={rememberDevice}
                  onCheckedChange={(checked) =>
                    onRememberDeviceChange(Boolean(checked))
                  }
                  aria-label="Recordar este dispositivo"
                />
                Guardaremos el refresh token localmente.
              </label>
            </FieldContent>
          </Field>
          <Field>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Spinner size="sm" className="text-current" />}
              {isLoading ? "Accediendo..." : "Acceder"}
            </Button>
            <FieldDescription className="text-center text-xs">
              ¿Olvidaste tu contraseña? Contacta al administrador de tu tenant.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center text-xs">
        Al continuar aceptas los términos del tenant y las políticas de
        seguridad de SalesNet.
      </FieldDescription>
    </div>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={cn("text-current", className)}
    >
      <path
        d="M15.454 1.25c.088 1.058-.31 2.116-.943 2.882-.657.793-1.723 1.407-2.76 1.33-.1-1.013.347-2.059.957-2.74.664-.754 1.827-1.312 2.746-1.472zm3.4 6.296c-.063.043-2.602 1.501-2.567 4.266.036 3.4 3.146 4.525 3.19 4.538-.015.057-.5 1.742-1.666 3.445-1.04 1.533-2.114 3.06-3.829 3.094-1.677.03-2.217-.996-4.135-.996-1.922 0-2.516 1-4.1 1.031-1.653.028-2.91-1.65-3.955-3.177-2.155-3.168-3.804-8.943-1.584-12.847 1.09-1.883 3.05-3.07 5.078-3.099 1.946-.037 3.544 1.044 4.145 1.044.6 0 2.282-1.286 3.85-1.096.656.027 2.504.267 3.553 2.197z"
        fill="currentColor"
      />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={cn("text-current", className)}
    >
      <path
        d="M20.16 12.187c0-.558-.05-1.096-.143-1.613H12v3.05h4.576c-.197 1.064-.789 1.966-1.68 2.57v2.138h2.722c1.596-1.47 2.542-3.632 2.542-6.145z"
        fill="#4285F4"
      />
      <path
        d="M12 21c2.43 0 4.468-.806 5.957-2.168l-2.722-2.138c-.756.507-1.72.807-3.235.807-2.483 0-4.584-1.677-5.336-3.928H3.84v2.207A8.997 8.997 0 0 0 12 21z"
        fill="#34A853"
      />
      <path
        d="M6.664 13.573a5.408 5.408 0 0 1-.282-1.773c0-.614.103-1.205.282-1.772V7.82H3.84A8.995 8.995 0 0 0 3 11.8c0 1.552.37 3.018.84 3.98l2.824-2.207z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.354c1.319 0 2.491.454 3.424 1.347l2.568-2.569C16.462 3.764 14.425 3 12 3 8.584 3 5.655 4.916 4.04 7.82l2.624 2.207C7.395 8.031 9.504 6.354 12 6.354z"
        fill="#EA4335"
      />
    </svg>
  );
}
