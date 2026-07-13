"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus } from "lucide-react";
import {
  getProducts,
  getCategories,
  getBrands,
  getSuppliers,
  createProduct,
} from "@/lib/api/products";
import {
  PageHeader,
  LoadingState,
  EmptyState,
  Alert,
} from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { useServerPagination } from "@/hooks/useServerPagination";
import { formatCurrency } from "@/lib/utils";
import type { Product, Category, Brand, Supplier } from "@/lib/types";
import { getErrorMessage } from "@/lib/api/client";

interface ProductForm {
  name: string;
  sku: string;
  barcode?: string;
  category_id: string;
  brand_id: string;
  supplier_id: string;
  cost_price: string;
  selling_price: string;
  unit_of_measure: string;
  is_perishable?: boolean;
  shelf_life_days?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const {
    page,
    setPage,
    pageSize,
    onPageSizeChange,
    pagination,
    applyResponse,
    resetPage,
  } = useServerPagination(10);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductForm>({
    defaultValues: { unit_of_measure: "pcs" },
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const productParams: Record<string, string> = {
        page: String(page),
        page_size: String(pageSize),
      };
      if (search) productParams.search = search;

      const [p, c, b, s] = await Promise.all([
        getProducts(productParams),
        getCategories({ page_size: "100" }),
        getBrands({ page_size: "100" }),
        getSuppliers({ page_size: "100" }),
      ]);
      setProducts(p.data.results);
      applyResponse(p.data);
      setCategories(c.data.results);
      setBrands(b.data.results);
      setSuppliers(s.data.results);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, applyResponse]);

  useEffect(() => {
    load();
  }, [load]);

  const closeForm = () => {
    setShowForm(false);
    reset({ unit_of_measure: "pcs" });
  };

  const onSubmit = async (data: ProductForm) => {
    setError("");
    setSubmitting(true);
    try {
      await createProduct({
        ...data,
        category_id: Number(data.category_id),
        brand_id: Number(data.brand_id),
        supplier_id: Number(data.supplier_id),
        is_perishable: Boolean(data.is_perishable),
        shelf_life_days: data.shelf_life_days ? Number(data.shelf_life_days) : null,
        is_active: true,
      });
      closeForm();
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Products"
        description="FMCG catalog for Bangladesh retail & wholesale"
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert message={error} />
        </div>
      )}

      <Modal
        open={showForm}
        onClose={closeForm}
        title="New Product"
        description="Add a product to your catalog."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Name"
            error={errors.name?.message}
            {...register("name", { required: "Required" })}
          />
          <Input
            label="SKU"
            error={errors.sku?.message}
            {...register("sku", { required: "Required" })}
          />
          <Input label="Barcode" {...register("barcode")} />
          <Input label="Unit" {...register("unit_of_measure")} />
          <Select
            label="Category"
            options={[
              { value: "", label: "Select..." },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
            error={errors.category_id?.message}
            {...register("category_id", { required: "Required" })}
          />
          <Select
            label="Brand"
            options={[
              { value: "", label: "Select..." },
              ...brands.map((b) => ({ value: b.id, label: b.name })),
            ]}
            error={errors.brand_id?.message}
            {...register("brand_id", { required: "Required" })}
          />
          <Select
            label="Supplier"
            options={[
              { value: "", label: "Select..." },
              ...suppliers.map((s) => ({ value: s.id, label: s.name })),
            ]}
            error={errors.supplier_id?.message}
            {...register("supplier_id", { required: "Required" })}
          />
          <Input
            label="Cost Price (BDT)"
            type="number"
            step="0.01"
            {...register("cost_price")}
          />
          <Input
            label="Selling Price (BDT)"
            type="number"
            step="0.01"
            {...register("selling_price")}
          />
          <label className="flex items-center gap-2 text-sm text-[#14201a] sm:col-span-2">
            <input type="checkbox" className="rounded" {...register("is_perishable")} />
            Perishable item (track expiry — milk, yogurt, bread)
          </label>
          <Input
            label="Default shelf life (days)"
            type="number"
            placeholder="e.g. 7 for fresh milk"
            {...register("shelf_life_days")}
          />
          <div className="flex justify-end gap-2 border-t border-[#ecf1ed] pt-4 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Save Product
            </Button>
          </div>
        </form>
      </Modal>

      <Card>
        <CardHeader>
          <Input
            placeholder="Search products, SKU, barcode..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
          />
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <LoadingState />
          ) : products.length === 0 ? (
            <EmptyState
              title="No products found"
              description="Seed demo data or add your first SKU."
            />
          ) : (
            <>
              <div className="divide-y divide-[#ecf1ed] sm:hidden">
                {products.map((p) => (
                  <div key={p.id} className="space-y-2 px-4 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[#14201a]">{p.name}</p>
                        <p className="text-xs text-[#5c6b63]">{p.sku}</p>
                      </div>
                      <Badge variant={p.is_active ? "success" : "default"}>
                        {p.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-[#5c6b63]">
                      {typeof p.category === "string" ? p.category : "—"} ·{" "}
                      {typeof p.brand === "string" ? p.brand : "—"}
                    </p>
                    {p.selling_price && (
                      <p className="text-sm font-medium">
                        {formatCurrency(p.selling_price)}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#ecf1ed] text-left text-[#5c6b63]">
                      <th className="px-6 py-3 font-medium">Name</th>
                      <th className="px-6 py-3 font-medium">SKU</th>
                      <th className="px-6 py-3 font-medium">Category</th>
                      <th className="px-6 py-3 font-medium">Brand</th>
                      <th className="px-6 py-3 font-medium">Price</th>
                      <th className="px-6 py-3 font-medium">Type</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-[#f4f6f3] hover:bg-[#f8faf8]"
                      >
                        <td className="px-6 py-3 font-medium text-[#14201a]">
                          {p.name}
                        </td>
                        <td className="px-6 py-3 font-mono text-xs text-[#5c6b63]">
                          {p.sku}
                        </td>
                        <td className="px-6 py-3 text-[#5c6b63]">
                          {typeof p.category === "string" ? p.category : "—"}
                        </td>
                        <td className="px-6 py-3 text-[#5c6b63]">
                          {typeof p.brand === "string" ? p.brand : "—"}
                        </td>
                        <td className="px-6 py-3">
                          {p.selling_price
                            ? formatCurrency(p.selling_price)
                            : "—"}
                        </td>
                        <td className="px-6 py-3">
                          {p.is_perishable ? (
                            <Badge variant="warning">Perishable</Badge>
                          ) : (
                            <Badge variant="default">Dry goods</Badge>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <Badge variant={p.is_active ? "success" : "default"}>
                            {p.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={pagination.current_page}
                totalPages={pagination.total_pages}
                totalCount={pagination.count}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={onPageSizeChange}
              />
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
