import { apiClient } from "./apiClient";

export const TransferStatus = {
  Pending: 0,
  InTransit: 1,
  Completed: 2,
  Cancelled: 3,
} as const;

export type TransferStatus = typeof TransferStatus[keyof typeof TransferStatus];

export interface WarehouseTransferItemCreateDto {
  productId: string;
  quantity: number;
}

export interface WarehouseTransferCreateDto {
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  notes?: string;
  items: WarehouseTransferItemCreateDto[];
}

export interface WarehouseTransferCompleteItemDto {
  transferItemId: string;
  receivedQuantity: number;
}

export interface WarehouseTransferCompleteDto {
  notes?: string;
  items?: WarehouseTransferCompleteItemDto[];
}

export interface WarehouseTransferItemDto {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  receivedQuantity: number | null;
}

export interface WarehouseTransferDto {
  id: string;
  transferNumber: string;
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  destinationWarehouseId: string;
  destinationWarehouseName: string;
  status: TransferStatus;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
  items: WarehouseTransferItemDto[];
}

export async function getWarehouseTransfers(): Promise<WarehouseTransferDto[]> {
  return apiClient<WarehouseTransferDto[]>("/api/warehousetransfers");
}

export async function getWarehouseTransferById(id: string): Promise<WarehouseTransferDto> {
  return apiClient<WarehouseTransferDto>(`/api/warehousetransfers/${id}`);
}

export async function createWarehouseTransfer(
  dto: WarehouseTransferCreateDto
): Promise<WarehouseTransferDto> {
  return apiClient<WarehouseTransferDto>("/api/warehousetransfers", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function shipWarehouseTransfer(id: string): Promise<void> {
  return apiClient<void>(`/api/warehousetransfers/${id}/ship`, {
    method: "POST",
  });
}

export async function completeWarehouseTransfer(
  id: string,
  dto: WarehouseTransferCompleteDto
): Promise<void> {
  return apiClient<void>(`/api/warehousetransfers/${id}/complete`, {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function cancelWarehouseTransfer(id: string): Promise<void> {
  return apiClient<void>(`/api/warehousetransfers/${id}/cancel`, {
    method: "POST",
  });
}
