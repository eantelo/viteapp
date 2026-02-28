import { apiClient } from "./apiClient";

export interface PermissionDto {
  id: string;
  module: string;
  action: string;
  code: string;
  description: string;
}

export interface RoleDto {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  isActive: boolean;
  permissions: PermissionDto[];
}

export async function getRoles(): Promise<RoleDto[]> {
  return apiClient<RoleDto[]>("/api/roles");
}

export async function getRolePermissions(): Promise<PermissionDto[]> {
  return apiClient<PermissionDto[]>("/api/roles/permissions");
}
