import { apiClient } from "@/api/apiClient";

export interface AuthResponse {
  token: string;
  refreshToken: string;
  email: string;
  role: string;
  tenantId: string;
  userId: string;
  isSetupComplete: boolean;
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

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  token: string;
  newPassword: string;
}

async function forgotPassword(
  payload: ForgotPasswordPayload
): Promise<{ message: string }> {
  return apiClient<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

async function resetPassword(
  payload: ResetPasswordPayload
): Promise<{ message: string }> {
  return apiClient<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

export const authApi = {
  login,
  register,
  refreshToken,
  revokeToken,
  forgotPassword,
  resetPassword,
};
