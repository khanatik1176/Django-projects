import { apiClient } from "./client";
import type { ApiResponse, AuthData, User } from "../types";

export async function login(email: string, password: string) {
  const { data } = await apiClient.post<ApiResponse<AuthData>>(
    "/accounts/login/",
    { email, password },
  );
  return data;
}

export async function register(payload: {
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}) {
  const { data } = await apiClient.post<ApiResponse<{ user: User }>>(
    "/accounts/register/",
    payload,
  );
  return data;
}

export async function logout(refresh: string) {
  const { data } = await apiClient.post<ApiResponse<null>>("/accounts/logout/", {
    refresh,
  });
  return data;
}

export async function getCurrentUser() {
  const { data } = await apiClient.get<ApiResponse<{ user: User }>>(
    "/accounts/current-user/",
  );
  return data;
}

export async function updateProfile(payload: FormData | Record<string, unknown>) {
  const isForm = payload instanceof FormData;
  const { data } = await apiClient.patch<ApiResponse<{ user: User }>>(
    "/accounts/current-user/",
    payload,
    isForm
      ? {
          headers: { "Content-Type": "multipart/form-data" },
          transformRequest: [
            (body, headers) => {
              if (headers && typeof headers === "object") {
                delete (headers as Record<string, unknown>)["Content-Type"];
              }
              return body;
            },
          ],
        }
      : undefined,
  );
  return data;
}

export async function requestPasswordOtp(email: string) {
  const { data } = await apiClient.post<
    ApiResponse<{
      email: string;
      sent: boolean;
      message: string;
      expires_in_minutes?: number;
      debug_otp?: string;
    }>
  >("/accounts/password/request-otp/", { email });
  return data;
}

export async function verifyPasswordOtp(email: string, code: string) {
  const { data } = await apiClient.post<
    ApiResponse<{ email: string; reset_token: string; message: string }>
  >("/accounts/password/verify-otp/", { email, code });
  return data;
}

export async function confirmPasswordReset(payload: {
  email: string;
  reset_token: string;
  new_password: string;
  confirm_password: string;
}) {
  const { data } = await apiClient.post<ApiResponse<null>>(
    "/accounts/password/confirm/",
    payload,
  );
  return data;
}
