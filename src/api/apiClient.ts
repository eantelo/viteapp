const DEFAULT_BASE_URL = "http://localhost:5205";
const AUTH_STORAGE_KEY = "salesnet.auth";

export interface ApiError extends Error {
  status?: number;
  details?: unknown;
}

export interface ApiRequestOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

const baseUrl =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ??
  DEFAULT_BASE_URL;

function buildHeaders(
  skipAuth: boolean | undefined,
  headers?: Record<string, string>
): Record<string, string> {
  const authHeaders: Record<string, string> = {};
  if (!skipAuth) {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { token?: string };
        if (parsed.token) {
          authHeaders.Authorization = `Bearer ${parsed.token}`;
        }
      }
    } catch (error) {
      console.warn("Failed to parse auth state", error);
    }
  }

  return {
    "Content-Type": "application/json",
    ...headers,
    ...authHeaders,
  };
}

export async function apiClient<TResponse>(
  path: string,
  { skipAuth, headers, body, method = "GET", ...rest }: ApiRequestOptions = {}
): Promise<TResponse> {
  const url = `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

  const response = await fetch(url, {
    method,
    headers: buildHeaders(skipAuth, headers),
    body,
    ...rest,
  });

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const text = await response.text();

  // Intentar parsear como JSON
  let payload: unknown;
  try {
    payload = text ? JSON.parse(text) : undefined;
  } catch (parseError) {
    // Si no es JSON válido, usar el texto plano
    console.error("Error parsing JSON response:", text);
    if (!response.ok) {
      const error: ApiError = new Error(
        text || `HTTP ${response.status}: ${response.statusText}`
      );
      error.status = response.status;
      error.details = text;
      throw error;
    }
    // Si la respuesta es OK pero no es JSON, devolver el texto
    return text as TResponse;
  }

  if (!response.ok) {
    const error: ApiError = new Error(
      (payload as { message?: string } | undefined)?.message ??
        `HTTP ${response.status}: ${response.statusText}`
    );
    error.status = response.status;
    error.details = payload;
    throw error;
  }

  return payload as TResponse;
}

export function persistAuthState(payload: unknown): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
}

export function clearAuthState(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function readAuthState<T>(): T | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error("Unable to parse stored auth state", error);
    clearAuthState();
    return null;
  }
}
