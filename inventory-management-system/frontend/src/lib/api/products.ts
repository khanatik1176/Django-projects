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

export async function getProduct(id: number) {
  const { data } = await apiClient.get<ApiResponse<Product>>(
    `/products/products/${id}/`,
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

export async function updateProduct(id: number, payload: Record<string, unknown>) {
  const { data } = await apiClient.patch<ApiResponse<Product>>(
    `/products/products/${id}/`,
    payload,
  );
  return data;
}

export async function deleteProduct(id: number) {
  const { data } = await apiClient.delete<ApiResponse<null>>(
    `/products/products/${id}/`,
  );
  return data;
}

export async function getProductByBarcode(barcode: string) {
  const { data } = await apiClient.get<ApiResponse<Product>>(
    `/products/products/by-barcode/${encodeURIComponent(barcode)}/`,
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

export async function createCategory(payload: Record<string, unknown>) {
  const { data } = await apiClient.post<ApiResponse<Category>>(
    "/products/categories/",
    payload,
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

export async function createBrand(payload: Record<string, unknown>) {
  const { data } = await apiClient.post<ApiResponse<Brand>>(
    "/products/brands/",
    payload,
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

export async function createSupplier(payload: Record<string, unknown>) {
  const { data } = await apiClient.post<ApiResponse<Supplier>>(
    "/products/suppliers/",
    payload,
  );
  return data;
}
