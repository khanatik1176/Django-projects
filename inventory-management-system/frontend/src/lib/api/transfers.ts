import { apiClient } from "./client";
import type { ApiResponse, PaginatedData } from "../types";

export interface StockTransfer {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  from_warehouse: number;
  from_warehouse_name: string;
  to_warehouse: number;
  to_warehouse_name: string;
  quantity: string;
  status: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
}

export async function getTransfers(params?: Record<string, string>) {
  const { data } = await apiClient.get<ApiResponse<PaginatedData<StockTransfer>>>(
    "/inventory/transfers/",
    { params },
  );
  return data;
}

export async function createTransfer(payload: Record<string, unknown>) {
  const { data } = await apiClient.post<ApiResponse<StockTransfer>>(
    "/inventory/transfers/",
    payload,
  );
  return data;
}

export async function completeTransfer(id: number) {
  const { data } = await apiClient.post<ApiResponse<StockTransfer>>(
    `/inventory/transfers/${id}/complete/`,
  );
  return data;
}

export async function cancelTransfer(id: number) {
  const { data } = await apiClient.post<ApiResponse<StockTransfer>>(
    `/inventory/transfers/${id}/cancel/`,
  );
  return data;
}
