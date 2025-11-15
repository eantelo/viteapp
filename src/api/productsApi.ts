import { apiClient } from "./apiClient";

export interface ProductDto {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  isActive: boolean;
}

export interface ProductCreateDto {
  name: string;
  sku: string;
  barcode: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
}

export interface ProductUpdateDto {
  name: string;
  sku: string;
  barcode: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  isActive: boolean;
}

export async function getProducts(search?: string): Promise<ProductDto[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiClient<ProductDto[]>(`/api/products${query}`);
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
