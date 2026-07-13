import { apiClient } from "./client";
import type {
  ApiResponse,
  Brand,
  Category,
  PaginatedData,
  Product,
  Supplier,
} from "../types";

export async function getProducts(params?: Record<string, string>) {
  const { data } = await apiClient.get<ApiResponse<PaginatedData<Product>>>(
    "/products/products/",
    { params },
  );
  return data;
}

export async function getCategories(params?: Record<string, string>) {
  const { data } = await apiClient.get<ApiResponse<PaginatedData<Category>>>(
    "/products/categories/",
    { params },
  );
  return data;
}

export async function getBrands(params?: Record<string, string>) {
  const { data } = await apiClient.get<ApiResponse<PaginatedData<Brand>>>(
    "/products/brands/",
    { params },
  );
  return data;
}

export async function getSuppliers(params?: Record<string, string>) {
  const { data } = await apiClient.get<ApiResponse<PaginatedData<Supplier>>>(
    "/products/suppliers/",
    { params },
  );
  return data;
}

export async function createProduct(payload: Record<string, unknown>) {
  const { data } = await apiClient.post<ApiResponse<Product>>(
    "/products/products/",
    payload,
  );
  return data;
}

export async function getProductByBarcode(barcode: string) {
  const { data } = await apiClient.get<ApiResponse<Product>>(
    `/products/products/by-barcode/${encodeURIComponent(barcode)}/`,
  );
  return data;
}
