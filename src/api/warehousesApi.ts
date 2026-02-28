import { apiClient } from "./apiClient";

export interface WarehouseDto {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  contactPerson: string | null;
  isDefault: boolean;
  isActive: boolean;
}

export interface WarehouseCreateDto {
  name: string;
  code?: string;
  address?: string;
  city?: string;
  phone?: string;
  contactPerson?: string;
  isDefault?: boolean;
}

export interface WarehouseUpdateDto {
  name: string;
  code?: string;
  address?: string;
  city?: string;
  phone?: string;
  contactPerson?: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface WarehouseStockProductDto {
  productId: string;
  productName: string;
  sku: string;
  stock: number;
}

export interface WarehouseStockSummaryDto {
  warehouseId: string;
  warehouseName: string;
  distinctProducts: number;
  totalUnits: number;
  products: WarehouseStockProductDto[];
}

export async function getWarehouses(search?: string): Promise<WarehouseDto[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiClient<WarehouseDto[]>(`/api/warehouses${query}`);
}

export async function getWarehouseById(id: string): Promise<WarehouseDto> {
  return apiClient<WarehouseDto>(`/api/warehouses/${id}`);
}

export async function getWarehouseStock(id: string): Promise<WarehouseStockSummaryDto> {
  return apiClient<WarehouseStockSummaryDto>(`/api/warehouses/${id}/stock`);
}

export async function createWarehouse(dto: WarehouseCreateDto): Promise<WarehouseDto> {
  return apiClient<WarehouseDto>("/api/warehouses", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function updateWarehouse(id: string, dto: WarehouseUpdateDto): Promise<void> {
  return apiClient<void>(`/api/warehouses/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
  });
}

export async function deleteWarehouse(id: string): Promise<void> {
  return apiClient<void>(`/api/warehouses/${id}`, {
    method: "DELETE",
  });
}
