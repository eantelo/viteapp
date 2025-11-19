import { apiClient } from "./apiClient";
import type { TenantSettings } from "../types/TenantSettings";

export async function getTenantSettings(): Promise<TenantSettings> {
  return apiClient<TenantSettings>("/api/tenant-settings");
}

export async function updateTenantSettings(
  settings: TenantSettings
): Promise<TenantSettings> {
  return apiClient<TenantSettings>("/api/tenant-settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}
