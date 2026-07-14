import { apiClient } from "./client";
import type { ApiResponse, PaginatedData } from "../types";

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  credit_balance: string;
  credit_limit: string;
  effective_credit_limit?: string;
  membership?: number | null;
  membership_name?: string;
  membership_code?: string;
  membership_color?: string;
  membership_discount_percent?: string | null;
  membership_points_per_hundred?: string | null;
  loyalty_points?: number;
  lifetime_points?: number;
  membership_joined_at?: string | null;
  is_active: boolean;
  notes?: string;
  created_at?: string;
}

export interface CreditTransaction {
  id: number;
  customer: number;
  customer_name?: string;
  transaction_type: string;
  amount: string;
  balance_after: string;
  sales_order?: number | null;
  notes?: string;
  created_at: string;
}

export async function getCustomers(params?: Record<string, string>) {
  const { data } = await apiClient.get<ApiResponse<PaginatedData<Customer>>>(
    "/orders/customers/",
    { params },
  );
  return data;
}

export async function createCustomer(payload: Record<string, unknown>) {
  const { data } = await apiClient.post<ApiResponse<Customer>>(
    "/orders/customers/",
    payload,
  );
  return data;
}

export async function updateCustomer(id: number, payload: Record<string, unknown>) {
  const { data } = await apiClient.patch<ApiResponse<Customer>>(
    `/orders/customers/${id}/`,
    payload,
  );
  return data;
}

export async function getCustomerByPhone(phone: string) {
  const { data } = await apiClient.get<ApiResponse<Customer>>(
    "/orders/customers/by-phone/",
    { params: { phone } },
  );
  return data;
}

export async function banCustomer(id: number) {
  const { data } = await apiClient.post<ApiResponse<Customer>>(
    `/orders/customers/${id}/ban/`,
  );
  return data;
}

export async function unbanCustomer(id: number) {
  const { data } = await apiClient.post<ApiResponse<Customer>>(
    `/orders/customers/${id}/unban/`,
  );
  return data;
}

export async function getCustomerTransactions(customerId: number) {
  const { data } = await apiClient.get<ApiResponse<CreditTransaction[]>>(
    `/orders/customers/${customerId}/transactions/`,
  );
  return data;
}

export async function collectPayment(
  customerId: number,
  amount: string,
  notes?: string,
  paymentMethod?: "CASH" | "BKASH" | "NAGAD" | "BANK",
) {
  const { data } = await apiClient.post<ApiResponse<unknown>>(
    `/orders/customers/${customerId}/collect-payment/`,
    { amount, notes, payment_method: paymentMethod ?? "CASH" },
  );
  return data;
}
