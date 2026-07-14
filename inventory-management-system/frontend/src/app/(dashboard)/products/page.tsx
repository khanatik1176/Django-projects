"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Pencil, Plus, Power } from "lucide-react";
import {
  getProducts,
  getProduct,
  getCategories,
  getBrands,
  getSuppliers,
  createProduct,
  updateProduct,
  createCategory,
  createBrand,
  createSupplier,
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

type QuickAddType = "category" | "brand" | "supplier";

function relationId(
  value: string | Category | Brand | Supplier | undefined,
): string {
  if (!value) return "";
  if (typeof value === "string") return "";
  return String(value.id);
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [quickAdd, setQuickAdd] = useState<QuickAddType | null>(null);
  const [quickName, setQuickName] = useState("");
  const [quickSubmitting, setQuickSubmitting] = useState(false);
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
    setValue,
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
    setEditingId(null);
    setQuickAdd(null);
    setQuickName("");
    reset({ unit_of_measure: "pcs" });
  };

  const openCreate = () => {
    setEditingId(null);
    reset({ unit_of_measure: "pcs" });
    setQuickAdd(null);
    setQuickName("");
    setShowForm(true);
  };

  const openEdit = async (id: number) => {
    setError("");
    setEditLoading(true);
    try {
      const res = await getProduct(id);
      const p = res.data;
      setEditingId(id);
      reset({
        name: p.name,
        sku: p.sku,
        barcode: p.barcode ?? "",
        category_id: relationId(p.category),
        brand_id: relationId(p.brand),
        supplier_id: relationId(p.supplier),
        cost_price: p.cost_price ?? "",
        selling_price: p.selling_price ?? "",
        unit_of_measure: p.unit_of_measure ?? "pcs",
        is_perishable: p.is_perishable ?? false,
        shelf_life_days:
          p.shelf_life_days != null ? String(p.shelf_life_days) : "",
      });
      setQuickAdd(null);
      setQuickName("");
      setShowForm(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setEditLoading(false);
    }
  };

  const onSubmit = async (data: ProductForm) => {
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        category_id: Number(data.category_id),
        brand_id: Number(data.brand_id),
        supplier_id: Number(data.supplier_id),
        is_perishable: Boolean(data.is_perishable),
        shelf_life_days: data.shelf_life_days
          ? Number(data.shelf_life_days)
          : null,
      };

      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct({ ...payload, is_active: true });
      }
      closeForm();
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (product: Product) => {
    setError("");
    setActionId(product.id);
    try {
      await updateProduct(product.id, { is_active: !product.is_active });
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionId(null);
    }
  };

  const handleQuickCreate = async (type: QuickAddType) => {
    const name = quickName.trim();
    if (!name) return;

    setQuickSubmitting(true);
    setError("");
    try {
      if (type === "category") {
        const res = await createCategory({ name, is_active: true });
        setCategories((prev) => [...prev, res.data]);
        setValue("category_id", String(res.data.id), { shouldValidate: true });
      } else if (type === "brand") {
        const res = await createBrand({ name, is_active: true });
        setBrands((prev) => [...prev, res.data]);
        setValue("brand_id", String(res.data.id), { shouldValidate: true });
      } else {
        const res = await createSupplier({ name, is_active: true });
        setSuppliers((prev) => [...prev, res.data]);
        setValue("supplier_id", String(res.data.id), { shouldValidate: true });
      }
      setQuickAdd(null);
      setQuickName("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setQuickSubmitting(false);
    }
  };

  const renderQuickAdd = (type: QuickAddType, label: string) => (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          {type === "category" && (
            <Select
              label="Category"
              options={[
                { value: "", label: "Select..." },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
              error={errors.category_id?.message}
              {...register("category_id", { required: "Required" })}
            />
          )}
          {type === "brand" && (
            <Select
              label="Brand"
              options={[
                { value: "", label: "Select..." },
                ...brands.map((b) => ({ value: b.id, label: b.name })),
              ]}
              error={errors.brand_id?.message}
              {...register("brand_id", { required: "Required" })}
            />
          )}
          {type === "supplier" && (
            <Select
              label="Supplier"
              options={[
                { value: "", label: "Select..." },
                ...suppliers.map((s) => ({ value: s.id, label: s.name })),
              ]}
              error={errors.supplier_id?.message}
              {...register("supplier_id", { required: "Required" })}
            />
          )}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mb-0.5 shrink-0"
          title={`Add ${label}`}
          onClick={() => {
            setQuickAdd(quickAdd === type ? null : type);
            setQuickName("");
          }}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      {quickAdd === type && (
        <div className="flex gap-2 rounded-xl border border-[#ecf1ed] bg-[#f8faf8] p-2">
          <Input
            placeholder={`New ${label.toLowerCase()} name`}
            value={quickName}
            onChange={(e) => setQuickName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleQuickCreate(type);
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            loading={quickSubmitting}
            onClick={() => handleQuickCreate(type)}
          >
            Add
          </Button>
        </div>
      )}
    </div>
  );

  const renderActions = (product: Product) => (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        loading={editLoading && editingId === product.id}
        onClick={() => openEdit(product.id)}
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </Button>
      <Button
        type="button"
        variant={product.is_active ? "ghost" : "secondary"}
        size="sm"
        loading={actionId === product.id}
        onClick={() => toggleActive(product)}
      >
        <Power className="h-3.5 w-3.5" />
        {product.is_active ? "Deactivate" : "Activate"}
      </Button>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Products"
        description="FMCG catalog for Bangladesh retail & wholesale"
        action={
          <Button onClick={openCreate}>
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
        title={editingId ? "Edit Product" : "New Product"}
        description={
          editingId
            ? "Update product details in your catalog."
            : "Add a product to your catalog."
        }
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
          {renderQuickAdd("category", "Category")}
          {renderQuickAdd("brand", "Brand")}
          {renderQuickAdd("supplier", "Supplier")}
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
              {editingId ? "Update Product" : "Save Product"}
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
                  <div key={p.id} className="space-y-3 px-4 py-4">
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
                    {renderActions(p)}
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
                      <th className="px-6 py-3 font-medium">Actions</th>
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
                        <td className="px-6 py-3">{renderActions(p)}</td>
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
