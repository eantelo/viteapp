import { apiClient } from "./apiClient";

export type InventoryCountStatus = "Draft" | "Completed" | "Cancelled" | "Reconciled";
export type InventoryCountLineResult =
  | "Pending"
  | "Counted"
  | "Match"
  | "Shortage"
  | "Surplus";

export interface InventoryCountSummaryDto {
  id: string;
  countNumber: string;
  warehouseId: string;
  warehouseName: string;
  status: InventoryCountStatus;
  version: string;
  snapshotAt: string;
  completedAt?: string;
  reconciledAt?: string;
  cancelledAt?: string;
  totalProducts: number;
  countedProducts: number;
  pendingProducts: number;
  discrepancyProducts: number;
}

export interface InventoryCountLineDto {
  id: string;
  productId: string;
  version: string;
  productName: string;
  sku: string;
  barcode?: string;
  countedQuantity?: number;
  adjustedCountedQuantity?: number;
  countedAt?: string;
  openingSystemQuantity?: number;
  systemQuantity?: number;
  netMovementDuringCount?: number;
  difference?: number;
  result: InventoryCountLineResult;
}

export interface InventoryCountDto {
  id: string;
  countNumber: string;
  warehouseId: string;
  warehouseName: string;
  status: InventoryCountStatus;
  version: string;
  notes?: string;
  snapshotAt: string;
  completedAt?: string;
  reconciledAt?: string;
  cancelledAt?: string;
  totalProducts: number;
  countedProducts: number;
  pendingProducts: number;
  systemUnits?: number;
  physicalCountedUnits?: number;
  countedUnits?: number;
  differenceUnits?: number;
  missingUnits?: number;
  surplusUnits?: number;
  matchingProducts: number;
  shortageProducts: number;
  surplusProducts: number;
  productsWithNetChanges: number;
  lines: InventoryCountLineDto[];
}

export async function getInventoryCounts(filters?: {
  warehouseId?: string;
  status?: InventoryCountStatus;
}): Promise<InventoryCountSummaryDto[]> {
  const query = new URLSearchParams();
  if (filters?.warehouseId) query.set("warehouseId", filters.warehouseId);
  if (filters?.status) query.set("status", filters.status);
  const suffix = query.size ? `?${query.toString()}` : "";
  return apiClient<InventoryCountSummaryDto[]>(`/api/inventory-counts${suffix}`);
}

export async function getInventoryCount(id: string): Promise<InventoryCountDto> {
  return apiClient<InventoryCountDto>(`/api/inventory-counts/${id}`);
}

export async function createInventoryCount(
  warehouseId: string,
  notes?: string,
): Promise<InventoryCountDto> {
  return apiClient<InventoryCountDto>("/api/inventory-counts", {
    method: "POST",
    body: JSON.stringify({ warehouseId, notes: notes?.trim() || null }),
  });
}

export async function setInventoryCountLine(
  countId: string,
  productId: string,
  countedQuantity: number,
  inventoryCountVersion: string,
): Promise<InventoryCountDto> {
  return apiClient<InventoryCountDto>(
    `/api/inventory-counts/${countId}/lines/${productId}`,
    {
      method: "PUT",
      body: JSON.stringify({ countedQuantity, inventoryCountVersion }),
    },
  );
}

export async function completeInventoryCount(
  id: string,
  inventoryCountVersion: string,
): Promise<InventoryCountDto> {
  return apiClient<InventoryCountDto>(`/api/inventory-counts/${id}/complete`, {
    method: "POST",
    body: JSON.stringify({ inventoryCountVersion }),
  });
}

export async function reconcileInventoryCount(
  id: string,
  inventoryCountVersion: string,
): Promise<InventoryCountDto> {
  return apiClient<InventoryCountDto>(`/api/inventory-counts/${id}/reconcile`, {
    method: "POST",
    body: JSON.stringify({ inventoryCountVersion }),
  });
}

export async function cancelInventoryCount(
  id: string,
  inventoryCountVersion: string,
): Promise<InventoryCountDto> {
  return apiClient<InventoryCountDto>(`/api/inventory-counts/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ inventoryCountVersion }),
  });
}
