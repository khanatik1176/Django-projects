import { apiClient } from "./client";
import type { ApiResponse, PaginatedData } from "../types";

export interface MembershipTier {
  id: number;
  name: string;
  code: string;
  description?: string;
  discount_percent: string;
  points_per_hundred: string;
  min_points: number;
  credit_limit_bonus: string;
  color: string;
  sort_order: number;
  is_system: boolean;
  is_active: boolean;
  benefits?: string;
  customer_count?: number;
}

export interface LoyaltyOffer {
  id: number;
  title: string;
  description?: string;
  offer_type: "PERCENT_OFF" | "FIXED_OFF" | "BONUS_POINTS" | "FREEBIE";
  value: string;
  points_cost: number;
  membership: number | null;
  membership_name?: string;
  min_points_balance: number;
  is_active: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
}

export interface PointsLedgerEntry {
  id: number;
  customer: number;
  customer_name?: string;
  entry_type: string;
  points: number;
  balance_after: number;
  sales_order?: number | null;
  offer?: number | null;
  offer_title?: string;
  notes?: string;
  created_at: string;
}

export async function getMemberships(params?: Record<string, string>) {
  const { data } = await apiClient.get<ApiResponse<PaginatedData<MembershipTier>>>(
    "/orders/memberships/",
    { params },
  );
  return data;
}

export async function createMembership(payload: Record<string, unknown>) {
  const { data } = await apiClient.post<ApiResponse<MembershipTier>>(
    "/orders/memberships/",
    payload,
  );
  return data;
}

export async function updateMembership(id: number, payload: Record<string, unknown>) {
  const { data } = await apiClient.patch<ApiResponse<MembershipTier>>(
    `/orders/memberships/${id}/`,
    payload,
  );
  return data;
}

export async function deleteMembership(id: number) {
  const { data } = await apiClient.delete<ApiResponse<null>>(
    `/orders/memberships/${id}/`,
  );
  return data;
}

export async function getLoyaltyOffers(params?: Record<string, string>) {
  const { data } = await apiClient.get<ApiResponse<PaginatedData<LoyaltyOffer>>>(
    "/orders/loyalty-offers/",
    { params },
  );
  return data;
}

export async function createLoyaltyOffer(payload: Record<string, unknown>) {
  const { data } = await apiClient.post<ApiResponse<LoyaltyOffer>>(
    "/orders/loyalty-offers/",
    payload,
  );
  return data;
}

export async function updateLoyaltyOffer(id: number, payload: Record<string, unknown>) {
  const { data } = await apiClient.patch<ApiResponse<LoyaltyOffer>>(
    `/orders/loyalty-offers/${id}/`,
    payload,
  );
  return data;
}

export async function deleteLoyaltyOffer(id: number) {
  const { data } = await apiClient.delete<ApiResponse<null>>(
    `/orders/loyalty-offers/${id}/`,
  );
  return data;
}

export async function assignMembership(customerId: number, membershipId: number | null) {
  const { data } = await apiClient.post<ApiResponse<import("./customers").Customer>>(
    `/orders/customers/${customerId}/assign-membership/`,
    { membership_id: membershipId },
  );
  return data;
}

export async function adjustPoints(customerId: number, points: number, notes?: string) {
  const { data } = await apiClient.post<ApiResponse<unknown>>(
    `/orders/customers/${customerId}/adjust-points/`,
    { points, notes },
  );
  return data;
}

export async function getPointsLedger(customerId: number) {
  const { data } = await apiClient.get<ApiResponse<PointsLedgerEntry[]>>(
    `/orders/customers/${customerId}/points-ledger/`,
  );
  return data;
}
