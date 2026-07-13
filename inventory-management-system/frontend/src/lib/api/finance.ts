import { apiClient } from "./client";
import type {
  ActivityLogEntry,
  ApiResponse,
  FinanceExpense,
  FinancePayment,
  FinanceSummary,
  PaginatedData,
} from "../types";

export async function getFinanceSummary() {
  const { data } = await apiClient.get<ApiResponse<FinanceSummary>>("/finance/summary/");
  return data;
}

export async function getPayments(params?: Record<string, string>) {
  const { data } = await apiClient.get<ApiResponse<PaginatedData<FinancePayment>>>(
    "/finance/payments/",
    { params },
  );
  return data;
}

export async function getExpenses(params?: Record<string, string>) {
  const { data } = await apiClient.get<ApiResponse<PaginatedData<FinanceExpense>>>(
    "/finance/expenses/",
    { params },
  );
  return data;
}

export async function createExpense(payload: {
  category: string;
  amount: string;
  description: string;
  expense_date: string;
  payment_method?: string;
  notes?: string;
}) {
  const { data } = await apiClient.post<ApiResponse<FinanceExpense>>(
    "/finance/expenses/",
    payload,
  );
  return data;
}

export async function deleteExpense(id: number) {
  const { data } = await apiClient.delete<ApiResponse<null>>(`/finance/expenses/${id}/`);
  return data;
}

export async function getActivityLogs(params?: Record<string, string>) {
  const { data } = await apiClient.get<ApiResponse<PaginatedData<ActivityLogEntry>>>(
    "/finance/activity-logs/",
    { params },
  );
  return data;
}
