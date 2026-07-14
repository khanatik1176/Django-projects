import { apiClient } from "./client";
import type { ApiResponse } from "../types";

export interface PosCheckoutResult {
  id: number;
  so_number: string;
  invoice_number: string;
  total: string;
  subtotal?: string;
  membership_discount?: string;
  offer_discount?: string;
  points_earned?: number;
  payment_method: string;
  item_count: number;
  status: string;
  customer_name: string;
  customer_phone: string;
  warehouse_name: string;
  order_date?: string | null;
  created_at?: string | null;
  items: {
    product_name: string;
    product_sku: string;
    quantity: string;
    unit_price: string;
    line_total: string;
  }[];
}

export async function posCheckout(payload: Record<string, unknown>) {
  const { data } = await apiClient.post<ApiResponse<PosCheckoutResult>>(
    "/inventory/pos/checkout/",
    payload,
  );
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
