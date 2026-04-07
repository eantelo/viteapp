import { apiClient } from "@/api/apiClient";

export type AccountOnboardingStatus =
  | "Pending"
  | "InProgress"
  | "Completed"
  | "Failed";

export interface AccountOnboardingAcceptedResponse {
  onboardingId: string;
  status: AccountOnboardingStatus;
  tenantCode: string;
  email: string;
  createdAt: string;
}

export interface AccountOnboardingStatusResponse {
  onboardingId: string;
  tenantId: string;
  status: AccountOnboardingStatus;
  currentStep: string;
  tenantCode: string;
  email: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
}

export async function getAccountOnboardingStatus(
  onboardingId: string,
): Promise<AccountOnboardingStatusResponse> {
  return apiClient<AccountOnboardingStatusResponse>(
    `/api/account-onboarding/${onboardingId}`,
    {
      skipAuth: true,
    },
  );
}
