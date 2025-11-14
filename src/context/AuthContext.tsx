import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthResponse } from "@/api/authApi";
import { authApi } from "@/api/authApi";
import type { ApiError } from "@/api/apiClient";
import {
  clearAuthState,
  persistAuthState,
  readAuthState,
} from "@/api/apiClient";
import { getTokenExpiration, isTokenExpired } from "@/lib/jwt";

const REFRESH_MARGIN_MS = 60_000; // 1 minuto
const MIN_REFRESH_DELAY_MS = 5_000;

interface RefreshState {
  isRefreshing: boolean;
  error: string | null;
  lastRefreshAt: string | null;
}

interface AuthContextValue {
  auth: AuthResponse | null;
  isAuthenticated: boolean;
  isRefreshing: boolean;
  refreshError: string | null;
  lastRefreshAt: string | null;
  setAuth: (payload: AuthResponse | null) => void;
  refreshSession: () => Promise<AuthResponse | void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuthState] = useState<AuthResponse | null>(() => {
    return readAuthState<AuthResponse>();
  });
  const [refreshState, setRefreshState] = useState<RefreshState>({
    isRefreshing: false,
    error: null,
    lastRefreshAt: null,
  });

  const setAuth = useCallback((payload: AuthResponse | null) => {
    setAuthState(payload);
    if (payload) {
      persistAuthState(payload);
    } else {
      clearAuthState();
    }
  }, []);

  const clearSession = useCallback(() => {
    setAuth(null);
    setRefreshState({
      isRefreshing: false,
      error: null,
      lastRefreshAt: null,
    });
  }, [setAuth]);

  const logout = useCallback(async () => {
    if (!auth?.refreshToken) {
      clearSession();
      return;
    }

    try {
      await authApi.revokeToken({ refreshToken: auth.refreshToken });
    } catch (error) {
      console.warn("No pudimos revocar el refresh token", error);
    } finally {
      clearSession();
    }
  }, [auth?.refreshToken, clearSession]);

  const refreshSession = useCallback(async () => {
    if (!auth?.refreshToken) {
      logout();
      return;
    }
    if (refreshState.isRefreshing) {
      return;
    }

    setRefreshState((prev) => ({
      ...prev,
      isRefreshing: true,
      error: null,
    }));

    try {
      const response = await authApi.refreshToken({
        refreshToken: auth.refreshToken,
      });
      setAuth(response);
      setRefreshState({
        isRefreshing: false,
        error: null,
        lastRefreshAt: new Date().toISOString(),
      });
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      setRefreshState({
        isRefreshing: false,
        error: apiError.message ?? "No pudimos renovar la sesión",
        lastRefreshAt: null,
      });
      await logout();
      throw apiError;
    }
  }, [auth?.refreshToken, logout, refreshState.isRefreshing, setAuth]);

  useEffect(() => {
    if (!auth?.token || !auth.refreshToken) {
      return undefined;
    }

    if (isTokenExpired(auth.token, REFRESH_MARGIN_MS)) {
      refreshSession()?.catch((error) => {
        console.error("Failed to refresh session", error);
      });
      return undefined;
    }

    const expiration = getTokenExpiration(auth.token);
    if (!expiration) {
      return undefined;
    }

    const delay = Math.max(
      expiration - Date.now() - REFRESH_MARGIN_MS,
      MIN_REFRESH_DELAY_MS
    );

    const timeoutId = window.setTimeout(() => {
      refreshSession()?.catch((error) => {
        console.error("Auto refresh failed", error);
      });
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [auth?.token, auth?.refreshToken, refreshSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      auth,
      isAuthenticated: Boolean(auth?.token),
      isRefreshing: refreshState.isRefreshing,
      refreshError: refreshState.error,
      setAuth,
      refreshSession,
      logout,
      lastRefreshAt: refreshState.lastRefreshAt,
    }),
    [
      auth,
      logout,
      refreshSession,
      refreshState.error,
      refreshState.isRefreshing,
      refreshState.lastRefreshAt,
      setAuth,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
