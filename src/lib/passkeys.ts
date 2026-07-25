function fromBase64Url(value: string): ArrayBuffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
  return bytes.buffer;
}

function toBase64Url(value: ArrayBuffer | null): string | null {
  if (!value) return null;
  const bytes = new Uint8Array(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function isPasskeySupported(): boolean {
  return typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    Boolean(window.PublicKeyCredential && navigator.credentials);
}

export function decodeCreationOptions(
  options: PublicKeyCredentialCreationOptions,
): PublicKeyCredentialCreationOptions {
  return {
    ...options,
    challenge: fromBase64Url(options.challenge as unknown as string),
    user: {
      ...options.user,
      id: fromBase64Url(options.user.id as unknown as string),
    },
    excludeCredentials: options.excludeCredentials?.map((credential) => ({
      ...credential,
      id: fromBase64Url(credential.id as unknown as string),
    })),
  };
}

export function decodeRequestOptions(
  options: PublicKeyCredentialRequestOptions,
): PublicKeyCredentialRequestOptions {
  return {
    ...options,
    challenge: fromBase64Url(options.challenge as unknown as string),
    allowCredentials: options.allowCredentials?.map((credential) => ({
      ...credential,
      id: fromBase64Url(credential.id as unknown as string),
    })),
  };
}

export function serializeCredential(credential: PublicKeyCredential): object {
  const response = credential.response;
  const common = {
    id: credential.id,
    rawId: toBase64Url(credential.rawId),
    type: credential.type,
    clientExtensionResults: credential.getClientExtensionResults(),
  };

  if (response instanceof AuthenticatorAttestationResponse) {
    return {
      ...common,
      response: {
        clientDataJSON: toBase64Url(response.clientDataJSON),
        attestationObject: toBase64Url(response.attestationObject),
        transports: response.getTransports?.() ?? [],
      },
    };
  }

  const assertion = response as AuthenticatorAssertionResponse;
  return {
    ...common,
    response: {
      clientDataJSON: toBase64Url(assertion.clientDataJSON),
      authenticatorData: toBase64Url(assertion.authenticatorData),
      signature: toBase64Url(assertion.signature),
      userHandle: toBase64Url(assertion.userHandle),
    },
  };
}

export function describePasskeyError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "La verificación fue cancelada o agotó el tiempo. Puedes intentarlo nuevamente.";
    }
    if (error.name === "InvalidStateError") {
      return "Esta passkey ya está registrada en el dispositivo.";
    }
    if (error.name === "SecurityError") {
      return "El dominio actual no está autorizado para usar passkeys.";
    }
    if (error.name === "NotSupportedError") {
      return "Este navegador o dispositivo no admite el tipo de passkey solicitado.";
    }
  }

  return error instanceof Error
    ? error.message
    : "No fue posible completar la operación con passkey.";
}
