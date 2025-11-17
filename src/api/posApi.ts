import { apiClient } from "./apiClient";

export interface PosHoldItemDto {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  stock: number;
  barcode?: string | null;
  brand?: string | null;
}

export interface PosHoldDto {
  id: string;
  customerId: string | null;
  customerName?: string | null;
  discount: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  notes?: string | null;
  items: PosHoldItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface PosHoldUpsertDto {
  id?: string;
  customerId: string | null;
  discount: number;
  notes?: string | null;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export async function getPosHolds(): Promise<PosHoldDto[]> {
  return apiClient<PosHoldDto[]>("/api/pos/holds");
}

export async function getPosHoldById(id: string): Promise<PosHoldDto> {
  return apiClient<PosHoldDto>(`/api/pos/holds/${id}`);
}

export async function savePosHold(
  dto: PosHoldUpsertDto
): Promise<PosHoldDto> {
  if (dto.id) {
    const { id, ...payload } = dto;
    return apiClient<PosHoldDto>(`/api/pos/holds/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  return apiClient<PosHoldDto>("/api/pos/holds", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function deletePosHold(id: string): Promise<void> {
  return apiClient<void>(`/api/pos/holds/${id}`, {
    method: "DELETE",
  });
}