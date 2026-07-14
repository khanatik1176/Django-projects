import { apiClient } from "./client";
import type { ApiResponse, PaginatedData, PurchaseOrder, SalesOrder } from "../types";

export async function getPurchaseOrders(params?: Record<string, string>) {
  const { data } = await apiClient.get<ApiResponse<PaginatedData<PurchaseOrder>>>(
    "/orders/purchase-orders/",
    { params },
  );
  return data;
}

export async function createPurchaseOrder(payload: Record<string, unknown>) {
  const { data } = await apiClient.post<ApiResponse<PurchaseOrder>>(
    "/orders/purchase-orders/",
    payload,
  );
  return data;
}

export async function submitPurchaseOrder(id: number) {
  const { data } = await apiClient.post<ApiResponse<PurchaseOrder>>(
    `/orders/purchase-orders/${id}/submit/`,
  );
  return data;
}

export async function receivePurchaseItem(
  orderId: number,
  itemId: number,
  quantity: number,
  extras?: { expiry_date?: string; batch_number?: string },
) {
  const { data } = await apiClient.post<ApiResponse<PurchaseOrder>>(
    `/orders/purchase-orders/${orderId}/items/${itemId}/receive/`,
    { quantity, ...extras },
  );
  return data;
}

export async function getSalesOrders(params?: Record<string, string>) {
  const { data } = await apiClient.get<ApiResponse<PaginatedData<SalesOrder>>>(
    "/orders/sales-orders/",
    { params },
  );
  return data;
}

export async function getSalesOrder(id: number) {
  const { data } = await apiClient.get<ApiResponse<SalesOrder>>(
    `/orders/sales-orders/${id}/`,
  );
  return data;
}

export async function getPosInvoices(params?: Record<string, string>) {
  return getSalesOrders({ source: "pos", ordering: "-created_at", ...params });
}

export async function createSalesOrder(payload: Record<string, unknown>) {
  const { data } = await apiClient.post<ApiResponse<SalesOrder>>(
    "/orders/sales-orders/",
    payload,
  );
  return data;
}

export async function confirmSalesOrder(id: number) {
  const { data } = await apiClient.post<ApiResponse<SalesOrder>>(
    `/orders/sales-orders/${id}/confirm/`,
  );
  return data;
}

export async function fulfillSalesItem(
  orderId: number,
  itemId: number,
  quantity: number,
) {
  const { data } = await apiClient.post<ApiResponse<SalesOrder>>(
    `/orders/sales-orders/${orderId}/items/${itemId}/fulfill/`,
    { quantity },
  );
  return data;
}

export async function cancelPurchaseOrder(id: number) {
  const { data } = await apiClient.post<ApiResponse<PurchaseOrder>>(
    `/orders/purchase-orders/${id}/cancel/`,
  );
  return data;
}

export async function cancelSalesOrder(id: number) {
  const { data } = await apiClient.post<ApiResponse<SalesOrder>>(
    `/orders/sales-orders/${id}/cancel/`,
  );
  return data;
}
