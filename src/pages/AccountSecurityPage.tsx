import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Fingerprint, ShieldCheck, Trash } from "@phosphor-icons/react";
import { authApi, type PasskeyCredentialInfo } from "@/api/authApi";
import type { ApiError } from "@/api/apiClient";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";
import {
  decodeCreationOptions,
  describePasskeyError,
  isPasskeySupported,
  serializeCredential,
} from "@/lib/passkeys";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function AccountSecurityPage() {
  useDocumentTitle("SalesNet | Seguridad");
  const location = useLocation();
  const autoEnrollHandled = useRef(false);
  const [credentials, setCredentials] = useState<PasskeyCredentialInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCredentials = useCallback(async () => {
    setIsLoading(true);
    try {
      setCredentials(await authApi.listPasskeys());
    } catch (requestError) {
      setError((requestError as ApiError).message ?? "No se pudieron cargar tus passkeys.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerPasskey = useCallback(async () => {
    setError(null);
    setMessage(null);
    if (!isPasskeySupported()) {
      setError("Este navegador no admite passkeys.");
      return;
    }

    setIsRegistering(true);
    try {
      const options = await authApi.beginPasskeyRegistration();
      const credential = await navigator.credentials.create({
        publicKey: decodeCreationOptions(
          options.publicKey as PublicKeyCredentialCreationOptions,
        ),
      });
      if (!(credential instanceof PublicKeyCredential)) {
        throw new Error("El navegador no devolvió una credencial válida.");
      }
      await authApi.completePasskeyRegistration(
        options.ceremonyId,
        serializeCredential(credential),
      );
      setMessage("La passkey fue registrada correctamente.");
      await loadCredentials();
    } catch (requestError) {
      setError(describePasskeyError(requestError));
    } finally {
      setIsRegistering(false);
    }
  }, [loadCredentials]);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  useEffect(() => {
    const shouldEnroll = Boolean((location.state as { autoEnroll?: boolean } | null)?.autoEnroll);
    if (shouldEnroll && !autoEnrollHandled.current) {
      autoEnrollHandled.current = true;
      registerPasskey();
    }
  }, [location.state, registerPasskey]);

  const revoke = async (credential: PasskeyCredentialInfo) => {
    if (!window.confirm("¿Revocar esta passkey? Ya no podrá usarse para iniciar sesión.")) {
      return;
    }

    setRevokingId(credential.id);
    setError(null);
    setMessage(null);
    try {
      await authApi.revokePasskey(credential.id);
      setCredentials((current) => current.filter((item) => item.id !== credential.id));
      setMessage("La passkey fue revocada.");
    } catch (requestError) {
      setError((requestError as ApiError).message ?? "No se pudo revocar la passkey.");
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: "Inicio", href: "/dashboard" },
        { label: "Seguridad" },
      ]}
    >
      <section className="mx-auto grid w-full max-w-3xl gap-6 py-6">
        <header>
          <p className="text-sm font-semibold text-primary">Tu cuenta</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Seguridad</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Administra las passkeys que permiten aprobar el acceso con huella,
            rostro o el desbloqueo seguro de tus dispositivos.
          </p>
        </header>

        {error && <Alert variant="error" message={error} role="alert" />}
        {message && <Alert variant="success" message={message} role="status" />}

        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="size-6" weight="duotone" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold">Passkeys</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Puedes registrar varias y conservar la contraseña como respaldo.
                </p>
              </div>
            </div>
            <Button onClick={registerPasskey} disabled={isRegistering || !isPasskeySupported()}>
              {isRegistering ? <Spinner size="sm" /> : <Fingerprint className="size-5" weight="duotone" />}
              {isRegistering ? "Esperando dispositivo…" : "Registrar passkey"}
            </Button>
          </div>

          <div className="mt-6 border-t border-border pt-4">
            {isLoading ? (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Spinner size="sm" /> Cargando passkeys…
              </div>
            ) : credentials.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Aún no registraste ninguna passkey.</p>
            ) : (
              <ul className="divide-y divide-border">
                {credentials.map((credential) => (
                  <li key={credential.id} className="flex items-center justify-between gap-4 py-4">
                    <div>
                      <p className="text-sm font-medium">{credential.relyingPartyId}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Registrada {new Date(credential.createdAt).toLocaleString()}
                        {credential.lastUsedAt
                          ? ` · Último uso ${new Date(credential.lastUsedAt).toLocaleString()}`
                          : ""}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={revokingId === credential.id}
                      onClick={() => revoke(credential)}
                    >
                      {revokingId === credential.id ? <Spinner size="sm" /> : <Trash className="size-4" />}
                      Revocar
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
