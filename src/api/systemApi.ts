import { apiClient } from "./apiClient";

export interface SystemInfoDto {
  apiBaseUrl: string;
  databaseConnectionString: string;
  environment: string;
  dotNetVersion: string;
  machineName: string;
  serverTime: string;
}

export async function getSystemInfo(): Promise<SystemInfoDto> {
  return apiClient<SystemInfoDto>("/api/system/info");
}
