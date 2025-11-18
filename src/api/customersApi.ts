import { apiClient } from "./apiClient";

export interface CustomerDto {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  taxId?: string | null;
  isActive: boolean;
  lastPurchaseDate?: string | null;
  lastPurchaseAmount?: number;
  totalPurchases?: number;
  loyaltyPoints?: number;
  pendingDebt?: number;
}

export interface CustomerCreateDto {
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  taxId?: string | null;
}

export interface CustomerUpdateDto extends CustomerCreateDto {
  isActive: boolean;
}

export async function getCustomers(): Promise<CustomerDto[]> {
  return apiClient<CustomerDto[]>("/api/customers");
}

export async function getCustomerById(id: string): Promise<CustomerDto> {
  return apiClient<CustomerDto>(`/api/customers/${id}`);
}

export async function createCustomer(
  dto: CustomerCreateDto
): Promise<CustomerDto> {
  return apiClient<CustomerDto>("/api/customers", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function updateCustomer(
  id: string,
  dto: CustomerUpdateDto
): Promise<void> {
  return apiClient<void>(`/api/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
  });
}

export async function deleteCustomer(id: string): Promise<void> {
  return apiClient<void>(`/api/customers/${id}`, {
    method: "DELETE",
  });
}
