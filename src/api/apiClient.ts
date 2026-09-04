const DEFAULT_BASE_URL = "http://localhost:5205";
const AUTH_STORAGE_KEY = "salesnet.auth";

export interface ApiError extends Error {
  status?: number;
  details?: unknown;
  traceId?: string;
}

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
  message?: string;
}

export interface ApiRequestOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

export const apiBaseUrl =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ??
  DEFAULT_BASE_URL;

function getApiErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const problem = payload as ProblemDetails;
  if (problem.message?.trim()) return problem.message;
  if (problem.detail?.trim()) return problem.detail;

  const validationMessage = problem.errors
    ? Object.values(problem.errors).flat().find((message) => message.trim())
    : undefined;
  if (validationMessage) return validationMessage;
  if (problem.title?.trim()) return problem.title;

  return fallback;
}

/**
 * Construye las cabeceras estándar de las solicitudes del navegador a la API.
 */
export function buildApiHeaders(
  skipAuth: boolean | undefined,
  headers?: Record<string, string>,
): Record<string, string> {
  const authHeaders: Record<string, string> = {};
  if (!skipAuth) {
    try {
      const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
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
    "X-Sales-Client": "Browser",
    ...headers,
    ...authHeaders,
  };
}

export async function apiClient<TResponse>(
  path: string,
  { skipAuth, headers, body, method = "GET", ...rest }: ApiRequestOptions = {},
): Promise<TResponse> {
  const url = `${apiBaseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

  const response = await fetch(url, {
    method,
    headers: buildApiHeaders(skipAuth, headers),
    body,
    credentials: "include",
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
    console.error("Error parsing JSON response:", parseError, text);
    if (!response.ok) {
      const error: ApiError = new Error(
        text || `HTTP ${response.status}: ${response.statusText}`,
      );
      error.status = response.status;
      error.details = text;
      throw error;
    }
    // Si la respuesta es OK pero no es JSON, devolver el texto
    return text as TResponse;
  }

  if (!response.ok) {
    const error: ApiError = new Error(getApiErrorMessage(
      payload,
      `HTTP ${response.status}: ${response.statusText}`,
    ));
    error.status = response.status;
    error.details = payload;
    error.traceId = (payload as ProblemDetails | undefined)?.traceId;
    throw error;
  }

  return payload as TResponse;
}

export function persistAuthState(payload: unknown): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
}

export function clearAuthState(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
}

export function readAuthState<T>(): T | null {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
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
