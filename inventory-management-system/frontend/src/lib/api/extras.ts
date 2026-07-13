import { apiClient } from "./client";
import type { ApiResponse } from "../types";

export async function posCheckout(payload: Record<string, unknown>) {
  const { data } = await apiClient.post<ApiResponse<{
    so_number: string;
    total: string;
    payment_method: string;
    item_count: number;
    status: string;
  }>>("/inventory/pos/checkout/", payload);
  return data;
}

export async function getClearanceHub() {
  const { data } = await apiClient.get<ApiResponse<import("../types").ClearanceHub>>(
    "/inventory/clearance/",
  );
  return data;
}

export async function getStockValuation(params?: Record<string, string>) {
  const { data } = await apiClient.get<ApiResponse<unknown>>(
    "/inventory/reports/stock-valuation/",
    { params },
  );
  return data;
}

export async function getMovementSummary(params?: Record<string, string>) {
  const { data } = await apiClient.get<ApiResponse<unknown>>(
    "/inventory/reports/movement-summary/",
    { params },
  );
  return data;
}

export async function getAbcAnalysis(params?: Record<string, string>) {
  const { data } = await apiClient.get<ApiResponse<unknown>>(
    "/inventory/reports/abc-analysis/",
    { params },
  );
  return data;
}
