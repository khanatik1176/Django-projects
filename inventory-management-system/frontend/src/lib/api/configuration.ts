import { apiClient } from "./client";
import type { ApiResponse, PaginatedData, Role, User } from "../types";

export async function getRoles() {
  const { data } = await apiClient.get<ApiResponse<{ results: Role[] }>>(
    "/accounts/roles/",
  );
  return data;
}

export async function createRole(payload: {
  name: string;
  code: string;
  description?: string;
  can_manage_users?: boolean;
  can_manage_config?: boolean;
  can_manage_inventory?: boolean;
  can_manage_orders?: boolean;
  can_view_reports?: boolean;
}) {
  const { data } = await apiClient.post<ApiResponse<Role>>(
    "/accounts/roles/",
    payload,
  );
  return data;
}

export async function updateRole(id: number, payload: Record<string, unknown>) {
  const { data } = await apiClient.patch<ApiResponse<Role>>(
    `/accounts/roles/${id}/`,
    payload,
  );
  return data;
}

export async function deleteRole(id: number) {
  const { data } = await apiClient.delete<ApiResponse<null>>(
    `/accounts/roles/${id}/`,
  );
  return data;
}

export async function getAdminUsers(params?: Record<string, string>) {
  const { data } = await apiClient.get<ApiResponse<PaginatedData<User>>>(
    "/accounts/users/",
    { params },
  );
  return data;
}

export async function createAdminUser(payload: Record<string, unknown>) {
  const { data } = await apiClient.post<ApiResponse<User>>(
    "/accounts/users/",
    payload,
  );
  return data;
}

export async function updateAdminUser(id: number, payload: Record<string, unknown>) {
  const { data } = await apiClient.patch<ApiResponse<User>>(
    `/accounts/users/${id}/`,
    payload,
  );
  return data;
}

export async function approveUser(id: number) {
  const { data } = await apiClient.post<ApiResponse<User>>(
    `/accounts/users/${id}/approve/`,
  );
  return data;
}

export async function banUser(id: number) {
  const { data } = await apiClient.post<ApiResponse<User>>(
    `/accounts/users/${id}/ban/`,
  );
  return data;
}

export async function unbanUser(id: number) {
  const { data } = await apiClient.post<ApiResponse<User>>(
    `/accounts/users/${id}/unban/`,
  );
  return data;
}
