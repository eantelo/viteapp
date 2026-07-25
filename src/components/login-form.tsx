import { useId, type FormEventHandler } from "react";
import { Link } from "react-router-dom";
import { Envelope, Eye, EyeSlash, Fingerprint, Lock } from "@phosphor-icons/react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

type LoginFormProps = {
  email: string;
  password: string;
  rememberDevice: boolean;
  showPassword: boolean;
  fieldErrors: Partial<Record<"email" | "password", string>>;
  errorMessage?: string | null;
  errorDetails?: string[];
  successMessage?: string | null;
  isLoading: boolean;
  isPasskeyLoading: boolean;
  isPasskeySupported: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onRememberDeviceChange: (value: boolean) => void;
  onPasskeyLogin: () => void;
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
  successMessage,
  isLoading,
  isPasskeyLoading,
  isPasskeySupported,
  onSubmit,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onRememberDeviceChange,
  onPasskeyLogin,
  className,
}: LoginFormProps) {
  const emailId = useId();
  const passwordId = useId();
  const rememberDeviceId = useId();
  const emailErrorId = `${emailId}-error`;
  const passwordErrorId = `${passwordId}-error`;

  return (
    <div className={cn("grid gap-6", className)}>
      {successMessage && (
        <Alert
          variant="success"
          message={successMessage}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        />
      )}
      {errorMessage && (
        <Alert
          variant="error"
          message={errorMessage}
          items={errorDetails}
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        />
      )}

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full"
        disabled={!isPasskeySupported || isLoading || isPasskeyLoading}
        onClick={onPasskeyLogin}
      >
        {isPasskeyLoading ? (
          <Spinner size="sm" className="mr-1 text-current" />
        ) : (
          <Fingerprint aria-hidden="true" className="mr-1 size-5" weight="duotone" />
        )}
        {isPasskeyLoading ? "Esperando aprobación…" : "Ingresar con passkey"}
      </Button>
      {!isPasskeySupported && (
        <p className="text-center text-xs text-muted-foreground">
          Este navegador no admite passkeys. Puedes ingresar con tu contraseña.
        </p>
      )}
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wide text-muted-foreground">o con contraseña</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onSubmit} noValidate aria-busy={isLoading}>
        <div className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor={emailId}>Correo electrónico</Label>
            <div className="relative">
              <Envelope
                aria-hidden="true"
                weight="duotone"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id={emailId}
                name="email"
                type="email"
                inputMode="email"
                placeholder="nombre@empresa.com…"
                autoComplete="email"
                spellCheck={false}
                required
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? emailErrorId : undefined}
                className={cn(
                  "h-11 pl-10",
                  fieldErrors.email && "border-destructive focus-visible:ring-destructive/30",
                )}
              />
            </div>
            {fieldErrors.email && (
              <p id={emailErrorId} role="alert" className="text-sm text-destructive">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <Label htmlFor={passwordId}>Contraseña</Label>
              <Link
                to="/forgot-password"
                className="rounded-sm text-sm font-medium text-primary underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <Lock
                aria-hidden="true"
                weight="duotone"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id={passwordId}
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Tu contraseña…"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? passwordErrorId : undefined}
                className={cn(
                  "h-11 pl-10 pr-12",
                  fieldErrors.password && "border-destructive focus-visible:ring-destructive/30",
                )}
              />
              <button
                type="button"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={showPassword}
                aria-controls={passwordId}
                onClick={onTogglePassword}
                className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                {showPassword ? (
                  <EyeSlash aria-hidden="true" weight="bold" className="size-4" />
                ) : (
                  <Eye aria-hidden="true" weight="bold" className="size-4" />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p id={passwordErrorId} role="alert" className="text-sm text-destructive">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2.5 rounded-lg py-1">
            <Checkbox
              id={rememberDeviceId}
              name="rememberDevice"
              checked={rememberDevice}
              onCheckedChange={(checked) => onRememberDeviceChange(Boolean(checked))}
            />
            <Label
              htmlFor={rememberDeviceId}
              className="cursor-pointer text-sm font-normal leading-5 text-muted-foreground"
            >
              Recordar este dispositivo por 30 días
            </Label>
          </div>

          <Button type="submit" className="h-11 w-full transition-colors" disabled={isLoading}>
            {isLoading && <Spinner size="sm" className="mr-1 text-current" />}
            {isLoading ? "Iniciando sesión…" : "Iniciar sesión"}
          </Button>
        </div>
      </form>

      <p className="text-center text-xs leading-5 text-muted-foreground">
        Acceso exclusivo para usuarios autorizados. Nunca compartas tu contraseña.
      </p>
    </div>
  );
}
