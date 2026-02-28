import { apiClient } from "./apiClient";

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  roleId: string;
  roleName: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserCreateDto {
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  password: string;
  isActive?: boolean;
}

export interface UserUpdateDto {
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  isActive: boolean;
}

export interface UserResetPasswordDto {
  newPassword: string;
}

export interface UserProfileDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export async function getUsers(): Promise<UserDto[]> {
  return apiClient<UserDto[]>("/api/users");
}

export async function getUserById(id: string): Promise<UserDto> {
  return apiClient<UserDto>(`/api/users/${id}`);
}

export async function createUser(dto: UserCreateDto): Promise<UserDto> {
  return apiClient<UserDto>("/api/users", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function updateUser(
  id: string,
  dto: UserUpdateDto,
): Promise<void> {
  return apiClient<void>(`/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
  });
}

export async function toggleUserActive(id: string): Promise<void> {
  return apiClient<void>(`/api/users/${id}/toggle-active`, {
    method: "PATCH",
  });
}

export async function resetUserPassword(
  id: string,
  dto: UserResetPasswordDto,
): Promise<void> {
  return apiClient<void>(`/api/users/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function getProfile(): Promise<UserProfileDto> {
  return apiClient<UserProfileDto>("/api/users/profile");
}

export async function updateProfile(
  dto: UserProfileDto,
): Promise<UserProfileDto> {
  return apiClient<UserProfileDto>("/api/users/profile", {
    method: "PUT",
    body: JSON.stringify(dto),
  });
}

export async function changePassword(dto: ChangePasswordDto): Promise<void> {
  return apiClient<void>("/api/users/profile/change-password", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}
