import { apiClient } from "./client";
import type { ApiResponse, PaginatedData } from "../types";

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  credit_balance: string;
  credit_limit: string;
  is_active: boolean;
  notes?: string;
  created_at?: string;
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

export async function collectPayment(customerId: number, amount: string, notes?: string) {
  const { data } = await apiClient.post<ApiResponse<unknown>>(
    `/orders/customers/${customerId}/collect-payment/`,
    { amount, notes },
  );
  return data;
}
