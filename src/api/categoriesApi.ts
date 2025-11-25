import { apiClient } from "./apiClient";

export interface CategoryDto {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface CategoryCreateDto {
  name: string;
  description?: string;
}

export interface CategoryUpdateDto {
  name: string;
  description?: string;
  isActive: boolean;
}

export async function getCategories(
  search?: string,
  options?: { signal?: AbortSignal }
): Promise<CategoryDto[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiClient<CategoryDto[]>(`/api/categories${query}`, {
    signal: options?.signal,
  });
}

export async function getCategoryById(id: string): Promise<CategoryDto> {
  return apiClient<CategoryDto>(`/api/categories/${id}`);
}

export async function createCategory(
  dto: CategoryCreateDto
): Promise<CategoryDto> {
  return apiClient<CategoryDto>("/api/categories", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function updateCategory(
  id: string,
  dto: CategoryUpdateDto
): Promise<void> {
  return apiClient<void>(`/api/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  return apiClient<void>(`/api/categories/${id}`, {
    method: "DELETE",
  });
}
