"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { PackagePlus, Pencil } from "lucide-react";
import { getStock, receiveStock } from "@/lib/api/inventory";
import { getProducts } from "@/lib/api/products";
import { getWarehouses } from "@/lib/api/inventory";
import { PageHeader, LoadingState, EmptyState, Alert } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { StockHealthBadge } from "@/components/inventory/StockHealthBadge";
import { StockQuantityCell } from "@/components/inventory/StockQuantityCell";
import { StockUpdateModal } from "@/components/inventory/StockUpdateModal";
import { useServerPagination } from "@/hooks/useServerPagination";
import { cn, formatNumber } from "@/lib/utils";
import { canUpdateStockList } from "@/lib/permissions";
import type { Stock, Product, Warehouse, StockHealthStatus } from "@/lib/types";
import { getErrorMessage } from "@/lib/api/client";
import { useAuth } from "@/providers/AuthProvider";

interface ReceiveForm {
  product_id: string;
  warehouse_id: string;
  quantity: string;
  reference_number?: string;
  notes?: string;
  expiry_date?: string;
  batch_number?: string;
}

const healthFilters: { id: "all" | StockHealthStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "EXPIRING_SOON", label: "Expiring soon" },
  { id: "LOW_STOCK", label: "Low stock" },
  { id: "ADEQUATE", label: "Adequate" },
  { id: "GOOD", label: "Good" },
  { id: "OUT_OF_STOCK", label: "Out of stock" },
];

export default function StockPage() {
  const { user } = useAuth();
  const [stock, setStock] = useState<Stock[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [healthFilter, setHealthFilter] = useState<"all" | StockHealthStatus>("all");
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const {
    page,
    setPage,
    pageSize,
    onPageSizeChange,
    pagination,
    applyResponse,
    resetPage,
  } = useServerPagination(10);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ReceiveForm>();
  const selectedProductId = watch("product_id");
  const selectedProduct = products.find((p) => String(p.id) === selectedProductId);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        page_size: String(pageSize),
      };
      if (healthFilter !== "all") params.health_status = healthFilter;

      const [s, p, w] = await Promise.all([
        getStock(params),
        getProducts({ page_size: "200" }),
        getWarehouses({ page_size: "100" }),
      ]);
      setStock(s.data.results);
      applyResponse(s.data);
      setProducts(p.data.results);
      setWarehouses(w.data.results);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, healthFilter, applyResponse]);

  useEffect(() => {
    load();
  }, [load]);

  const closeForm = () => {
    setShowForm(false);
    reset();
  };

  const onReceive = async (data: ReceiveForm) => {
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await receiveStock({
        product_id: Number(data.product_id),
        warehouse_id: Number(data.warehouse_id),
        quantity: data.quantity,
        reference_number: data.reference_number,
        notes: data.notes,
        expiry_date: data.expiry_date || undefined,
        batch_number: data.batch_number,
      });
      setSuccess("Stock received successfully");
      closeForm();
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const canReceive = user?.can_manage_inventory !== false;
  const canUpdate = canUpdateStockList(user);

  return (
    <div>
      <PageHeader
        title="Stock Levels"
        description="Grocery shelf health — low, adequate, good & expiry alerts"
        action={
          canReceive ? (
            <Button onClick={() => setShowForm(true)}>
              <PackagePlus className="h-4 w-4" />
              Receive Stock
            </Button>
          ) : undefined
        }
      />

      {error && <div className="mb-4"><Alert message={error} /></div>}
      {success && <div className="mb-4"><Alert type="success" message={success} /></div>}

      <Modal
        open={showForm}
        onClose={closeForm}
        title="Receive Stock"
        description="Add inbound inventory. For milk, yogurt, bread — add expiry date."
      >
        <form onSubmit={handleSubmit(onReceive)} className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Product"
            options={[{ value: "", label: "Select..." }, ...products.map((p) => ({ value: p.id, label: `${p.sku} — ${p.name}${p.is_perishable ? " 🥛" : ""}` }))]}
            error={errors.product_id?.message}
            {...register("product_id", { required: "Required" })}
          />
          <Select
            label="Warehouse"
            options={[{ value: "", label: "Select..." }, ...warehouses.map((w) => ({ value: w.id, label: w.name }))]}
            error={errors.warehouse_id?.message}
            {...register("warehouse_id", { required: "Required" })}
          />
          <Input label="Quantity" type="number" step="0.01" error={errors.quantity?.message} {...register("quantity", { required: "Required" })} />
          <Input label="Reference #" {...register("reference_number")} />
          {(selectedProduct?.is_perishable || selectedProduct?.shelf_life_days) && (
            <>
              <Input label="Expiry date" type="date" {...register("expiry_date")} />
              <Input label="Batch / lot #" placeholder="LOT-2026-01" {...register("batch_number")} />
            </>
          )}
          <Input label="Notes" className="sm:col-span-2" {...register("notes")} />
          <div className="flex justify-end gap-2 border-t border-[#ecf1ed] pt-4 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={closeForm}>Cancel</Button>
            <Button type="submit" loading={submitting}>Receive</Button>
          </div>
        </form>
      </Modal>

      <StockUpdateModal
        stock={editingStock}
        open={!!editingStock}
        onClose={() => setEditingStock(null)}
        onUpdated={load}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {healthFilters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setHealthFilter(f.id);
              resetPage();
            }}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              healthFilter === f.id
                ? "bg-[#0b6e4f] text-white"
                : "bg-[#ecf1ed] text-[#5c6b63] hover:bg-[#e6f4ee]",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        <CardBody className="p-0">
          {loading ? <LoadingState /> : stock.length === 0 ? (
            <EmptyState title="No stock records" description="Receive stock or change the health filter." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-slate-500">
                      <th className="px-6 py-3 font-medium">Product</th>
                      <th className="px-6 py-3 font-medium">Warehouse</th>
                      <th className="px-6 py-3 font-medium">Stock quantity</th>
                      <th className="px-6 py-3 font-medium">Reorder</th>
                      <th className="px-6 py-3 font-medium">Shelf health</th>
                      {canUpdate && <th className="px-6 py-3 font-medium">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {stock.map((s) => (
                      <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="px-6 py-3">
                          <p className="font-medium text-slate-900">{s.product_name}</p>
                          <p className="text-xs text-slate-500">
                            {s.product_sku}
                            {s.is_perishable && " · perishable"}
                          </p>
                        </td>
                        <td className="px-6 py-3">{s.warehouse_name}</td>
                        <td className="px-6 py-3">
                          <StockQuantityCell stock={s} />
                        </td>
                        <td className="px-6 py-3">{formatNumber(s.reorder_level)}</td>
                        <td className="px-6 py-3">
                          <StockHealthBadge
                            status={s.health_status}
                            label={s.health_label}
                            daysToExpiry={s.days_to_expiry}
                          />
                        </td>
                        {canUpdate && (
                          <td className="px-6 py-3">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => setEditingStock(s)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Update
                            </Button>
                          </td>
                        )}
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
