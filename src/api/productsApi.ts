import { apiClient } from "./apiClient";

export interface ProductDto {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  barcode: string;
  brand: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  reservedStock: number;
  isActive: boolean;
}

export interface ProductCreateDto {
  name: string;
  description?: string;
  sku: string;
  barcode: string;
  brand: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
}

export interface ProductUpdateDto {
  name: string;
  description?: string;
  sku: string;
  barcode: string;
  brand: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  isActive: boolean;
}

export interface ProductMetadataSuggestion {
  brand: string | null;
  category: string | null;
  description: string | null;
  confidence: number | null;
  source: string;
}

export async function getProducts(
  search?: string,
  options?: { signal?: AbortSignal }
): Promise<ProductDto[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiClient<ProductDto[]>(`/api/products${query}`, {
    signal: options?.signal,
  });
}

export async function getProductById(id: string): Promise<ProductDto> {
  return apiClient<ProductDto>(`/api/products/${id}`);
}

export async function getProductByBarcode(
  barcode: string
): Promise<ProductDto> {
  return apiClient<ProductDto>(`/api/products/by-barcode/${barcode}`);
}

export async function createProduct(
  dto: ProductCreateDto
): Promise<ProductDto> {
  return apiClient<ProductDto>("/api/products", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function updateProduct(
  id: string,
  dto: ProductUpdateDto
): Promise<void> {
  return apiClient<void>(`/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  return apiClient<void>(`/api/products/${id}`, {
    method: "DELETE",
  });
}

export async function deactivateProduct(id: string): Promise<void> {
  return apiClient<void>(`/api/products/${id}/deactivate`, {
    method: "POST",
  });
}

export async function getCategories(): Promise<string[]> {
  return apiClient<string[]>("/api/products/categories");
}

export async function getBrands(): Promise<string[]> {
  return apiClient<string[]>("/api/products/brands");
}

export async function suggestProductMetadata(
  name: string,
  signal?: AbortSignal
): Promise<ProductMetadataSuggestion> {
  return apiClient<ProductMetadataSuggestion>("/api/products/suggestions", {
    method: "POST",
    body: JSON.stringify({ name }),
    signal,
  });
}
