import { apiClient } from "@/api/apiClient";

export interface TenantItem {
  id: string;
  name: string;
  code: string;
}

export interface TenantFeatureItem {
  feature: string;
  isEnabled: boolean;
}

export async function getTenants(): Promise<TenantItem[]> {
  return apiClient<TenantItem[]>("/api/admin/tenants");
}

export async function getTenantFeatures(
  tenantId: string,
): Promise<TenantFeatureItem[]> {
  return apiClient<TenantFeatureItem[]>(
    `/api/admin/tenants/${tenantId}/features`,
  );
}

export async function updateTenantFeatures(
  tenantId: string,
  features: TenantFeatureItem[],
): Promise<void> {
  await apiClient<void>(`/api/admin/tenants/${tenantId}/features`, {
    method: "PUT",
    body: JSON.stringify({ features }),
  });
}
