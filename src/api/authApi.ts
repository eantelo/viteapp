import { apiClient } from "@/api/apiClient";

export interface AuthResponse {
  token: string;
  refreshToken: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  features: string[];
  tenantId: string;
  tenantName: string;
  userId: string;
  isSetupComplete: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface PasskeyOptionsResponse {
  ceremonyId: string;
  publicKey: PublicKeyCredentialCreationOptions | PublicKeyCredentialRequestOptions;
}

export interface PasskeyCredentialInfo {
  id: string;
  relyingPartyId: string;
  createdAt: string;
  lastUsedAt: string | null;
  isBackedUp: boolean;
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
  payload: RefreshTokenPayload,
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
  payload: ForgotPasswordPayload,
): Promise<{ message: string }> {
  return apiClient<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

async function resetPassword(
  payload: ResetPasswordPayload,
): Promise<{ message: string }> {
  return apiClient<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

async function beginPasskeyRegistration(): Promise<PasskeyOptionsResponse> {
  return apiClient<PasskeyOptionsResponse>("/api/auth/passkeys/registration/options", {
    method: "POST",
    body: "{}",
  });
}

async function completePasskeyRegistration(ceremonyId: string, credential: object): Promise<void> {
  await apiClient("/api/auth/passkeys/registration/verify", {
    method: "POST",
    body: JSON.stringify({ ceremonyId, credential }),
  });
}

async function beginPasskeyAuthentication(): Promise<PasskeyOptionsResponse> {
  return apiClient<PasskeyOptionsResponse>("/api/auth/passkeys/authentication/options", {
    method: "POST",
    body: "{}",
    skipAuth: true,
  });
}

async function completePasskeyAuthentication(
  ceremonyId: string,
  credential: object,
): Promise<AuthResponse> {
  return apiClient<AuthResponse>("/api/auth/passkeys/authentication/verify", {
    method: "POST",
    body: JSON.stringify({ ceremonyId, credential }),
    skipAuth: true,
  });
}

async function listPasskeys(): Promise<PasskeyCredentialInfo[]> {
  return apiClient<PasskeyCredentialInfo[]>("/api/auth/passkeys");
}

async function revokePasskey(credentialId: string): Promise<void> {
  await apiClient<void>(`/api/auth/passkeys/${credentialId}`, { method: "DELETE" });
}

export const authApi = {
  login,
  register,
  refreshToken,
  revokeToken,
  forgotPassword,
  resetPassword,
  beginPasskeyRegistration,
  completePasskeyRegistration,
  beginPasskeyAuthentication,
  completePasskeyAuthentication,
  listPasskeys,
  revokePasskey,
};
