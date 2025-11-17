import { apiClient } from "@/api/apiClient";

export interface AuthResponse {
  token: string;
  refreshToken: string;
  email: string;
  role: string;
  tenantId: string;
  userId: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  tenantCode: string;
  email: string;
  password: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface RevokeTokenPayload {
  refreshToken: string;
}

async function login(payload: LoginPayload): Promise<AuthResponse> {
  return apiClient<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

async function register(payload: RegisterPayload): Promise<AuthResponse> {
  return apiClient<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

async function refreshToken(
  payload: RefreshTokenPayload
): Promise<AuthResponse> {
  return apiClient<AuthResponse>("/api/auth/refresh-token", {
    method: "POST",
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

async function revokeToken(payload: RevokeTokenPayload): Promise<void> {
  await apiClient<void>("/api/auth/revoke-token", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export const authApi = {
  login,
  register,
  refreshToken,
  revokeToken,
};
