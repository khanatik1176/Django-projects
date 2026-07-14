import { apiClient } from "./client";
import type {
  ApiResponse,
  DashboardData,
  PaginatedData,
  ShopInsights,
  Stock,
  StockMovement,
  Warehouse,
} from "../types";

export async function getDashboard() {
  const { data } = await apiClient.get<ApiResponse<DashboardData>>(
    "/inventory/dashboard/",
  );
  return data;
}

export async function getWarehouses(params?: Record<string, string>) {
  const { data } = await apiClient.get<ApiResponse<PaginatedData<Warehouse>>>(
    "/inventory/warehouses/",
    { params },
  );
  return data;
}

export async function createWarehouse(payload: Record<string, unknown>) {
  const { data } = await apiClient.post<ApiResponse<Warehouse>>(
    "/inventory/warehouses/",
    payload,
  );
  return data;
}

export async function updateWarehouse(id: number, payload: Record<string, unknown>) {
  const { data } = await apiClient.patch<ApiResponse<Warehouse>>(
    `/inventory/warehouses/${id}/`,
    payload,
  );
  return data;
}

export async function deleteWarehouse(id: number) {
  const { data } = await apiClient.delete<ApiResponse<null>>(
    `/inventory/warehouses/${id}/`,
  );
  return data;
}

export async function getStock(params?: Record<string, string>) {
  const { data } = await apiClient.get<ApiResponse<PaginatedData<Stock>>>(
    "/inventory/stock/",
    { params },
  );
  return data;
}

export async function getStockDetail(id: number) {
  const { data } = await apiClient.get<ApiResponse<import("../types").StockDetail>>(
    `/inventory/stock/${id}/`,
  );
  return data;
}

export async function manageStock(id: number, payload: Record<string, unknown>) {
  const { data } = await apiClient.post<ApiResponse<unknown>>(
    `/inventory/stock/${id}/manage/`,
    payload,
  );
  return data;
}

export async function updateStockThresholds(
  id: number,
  payload: { reorder_level?: string; max_stock_level?: string | null },
) {
  const { data } = await apiClient.patch<ApiResponse<unknown>>(
    `/inventory/stock/${id}/`,
    payload,
  );
  return data;
}

export async function getLowStock() {
  const { data } = await apiClient.get<
    ApiResponse<Stock[] | PaginatedData<Stock>>
  >("/inventory/stock/low-stock/");
  return data;
}

export async function receiveStock(payload: Record<string, unknown>) {
  const { data } = await apiClient.post<ApiResponse<unknown>>(
    "/inventory/stock/receive/",
    payload,
  );
  return data;
}

export async function issueStock(payload: {
  product_id: number;
  warehouse_id: number;
  quantity: string | number;
  reference_number?: string;
  notes?: string;
}) {
  const { data } = await apiClient.post<ApiResponse<unknown>>(
    "/inventory/stock/issue/",
    payload,
  );
  return data;
}

export async function adjustStock(payload: {
  product_id: number;
  warehouse_id: number;
  new_quantity: string | number;
  notes?: string;
}) {
  const { data } = await apiClient.post<ApiResponse<unknown>>(
    "/inventory/stock/adjust/",
    payload,
  );
  return data;
}

export async function getExpiringBatches(withinDays = 14) {
  const { data } = await apiClient.get<ApiResponse<unknown>>(
    "/inventory/stock/expiring/",
    { params: { within_days: String(withinDays) } },
  );
  return data;
}

export async function getMovements(params?: Record<string, string>) {
  const { data } = await apiClient.get<ApiResponse<PaginatedData<StockMovement>>>(
    "/inventory/movements/",
    { params },
  );
  return data;
}

export async function getShopInsights() {
  const { data } = await apiClient.get<ApiResponse<ShopInsights>>(
    "/inventory/shop-insights/",
  );
  return data;
}

export async function getStockHealthSummary() {
  const { data } = await apiClient.get<
    ApiResponse<{ counts: Record<string, number>; labels: Record<string, string> }>
  >("/inventory/stock/health-summary/");
  return data;
}
