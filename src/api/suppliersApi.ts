import { apiClient } from "./apiClient";

export interface SupplierDto {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  taxId?: string | null;
  contactPerson?: string | null;
  note?: string | null;
  isActive: boolean;
}

export interface SupplierCreateDto {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  taxId?: string | null;
  contactPerson?: string | null;
  note?: string | null;
}

export interface SupplierUpdateDto extends SupplierCreateDto {
  isActive: boolean;
}

export async function getSuppliers(): Promise<SupplierDto[]> {
  return apiClient<SupplierDto[]>("/api/suppliers");
}

export async function getSupplierById(id: string): Promise<SupplierDto> {
  return apiClient<SupplierDto>(`/api/suppliers/${id}`);
}

export async function createSupplier(
  dto: SupplierCreateDto,
): Promise<SupplierDto> {
  return apiClient<SupplierDto>("/api/suppliers", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function updateSupplier(
  id: string,
  dto: SupplierUpdateDto,
): Promise<void> {
  return apiClient<void>(`/api/suppliers/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
  });
}

export async function deleteSupplier(id: string): Promise<void> {
  return apiClient<void>(`/api/suppliers/${id}`, {
    method: "DELETE",
  });
}
