import { useId, type FormEventHandler } from "react";
import { Link } from "react-router-dom";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

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
  successMessage,
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
    <div className={cn("grid gap-6", className)}>
      {successMessage && (
        <Alert variant="success" message={successMessage} />
      )}
      {errorMessage && (
        <Alert variant="error" message={errorMessage} items={errorDetails} />
      )}
      <form onSubmit={onSubmit} noValidate>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor={emailId}>Correo electrónico</Label>
            <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id={emailId}
                  name="email"
                  type="email"
                  placeholder="nombre@empresa.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => onEmailChange(event.target.value)}
                  className={cn("pl-9", fieldErrors.email && "border-red-500 focus-visible:ring-red-500")}
                />
            </div>
            {fieldErrors.email && (
              <p className="text-sm text-red-500">{fieldErrors.email}</p>
            )}
          </div>
          
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
                <Label htmlFor={passwordId}>Contraseña</Label>
                <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                    ¿Olvidaste tu contraseña?
                </Link>
            </div>
            <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id={passwordId}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  className={cn("pl-9 pr-9", fieldErrors.password && "border-red-500 focus-visible:ring-red-500")}
                />
                <button
                    type="button"
                    onClick={onTogglePassword}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                    {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                    ) : (
                        <Eye className="h-4 w-4" />
                    )}
                </button>
            </div>
            {fieldErrors.password && (
              <p className="text-sm text-red-500">{fieldErrors.password}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={rememberDevice}
              onCheckedChange={(checked) =>
                onRememberDeviceChange(Boolean(checked))
              }
            />
            <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
                Recordar este dispositivo por 30 días
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Spinner size="sm" className="mr-2 text-current" />}
            {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
          </Button>
        </div>
      </form>
      
      <div className="text-center text-xs text-muted-foreground">
        Protegido por reCAPTCHA y sujeto a la <a href="#" className="underline hover:text-primary">Política de Privacidad</a> y <a href="#" className="underline hover:text-primary">Términos del Servicio</a>.
      </div>
    </div>
  );
}
