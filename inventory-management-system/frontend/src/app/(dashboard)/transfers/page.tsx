"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowLeftRight, Plus } from "lucide-react";
import {
  cancelTransfer,
  completeTransfer,
  createTransfer,
  getTransfers,
  type StockTransfer,
} from "@/lib/api/transfers";
import { getProducts } from "@/lib/api/products";
import { getWarehouses } from "@/lib/api/inventory";
import { PageHeader, LoadingState, EmptyState, Alert } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { useServerPagination } from "@/hooks/useServerPagination";
import { formatDate, formatNumber } from "@/lib/utils";
import type { Product, Warehouse } from "@/lib/types";
import { getErrorMessage } from "@/lib/api/client";

interface TransferForm {
  product: string;
  from_warehouse: string;
  to_warehouse: string;
  quantity: string;
  reference_number?: string;
  notes?: string;
}

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [fromWarehouse, setFromWarehouse] = useState("");
  const [toWarehouse, setToWarehouse] = useState("");
  const { page, setPage, pageSize, onPageSizeChange, pagination, applyResponse, resetPage } =
    useServerPagination(10);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TransferForm>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        page_size: String(pageSize),
      };
      if (statusFilter) params.status = statusFilter;
      if (fromWarehouse) params.from_warehouse = fromWarehouse;
      if (toWarehouse) params.to_warehouse = toWarehouse;

      const res = await getTransfers(params);
      setTransfers(res.data.results);
      applyResponse(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, fromWarehouse, toWarehouse, applyResponse]);

  useEffect(() => {
    load();
    getProducts({ page_size: "200" }).then((r) => setProducts(r.data.results));
    getWarehouses({ page_size: "50" }).then((r) => setWarehouses(r.data.results));
  }, [load]);

  const onSubmit = async (data: TransferForm) => {
    setSubmitting(true);
    setError("");
    try {
      await createTransfer({
        product: Number(data.product),
        from_warehouse: Number(data.from_warehouse),
        to_warehouse: Number(data.to_warehouse),
        quantity: data.quantity,
        reference_number: data.reference_number,
        notes: data.notes,
      });
      setShowForm(false);
      reset();
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
        title="Stock Transfers"
        description="Move stock between godown and counter — branch replenishment"
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            New Transfer
          </Button>
        }
      />

      {error && <div className="mb-4"><Alert message={error} /></div>}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Transfer stock">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <Select label="Product" options={products.map((p) => ({ value: p.id, label: p.name }))} error={errors.product?.message} {...register("product", { required: true })} />
          <Input label="Quantity" type="number" step="0.01" error={errors.quantity?.message} {...register("quantity", { required: true })} />
          <Select label="From" options={warehouses.map((w) => ({ value: w.id, label: w.name }))} {...register("from_warehouse", { required: true })} />
          <Select label="To" options={warehouses.map((w) => ({ value: w.id, label: w.name }))} {...register("to_warehouse", { required: true })} />
          <Input label="Reference" {...register("reference_number")} />
          <Input label="Notes" {...register("notes")} />
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Create</Button>
          </div>
        </form>
      </Modal>

      <Card>
        <CardHeader>
          <div className="grid gap-3 sm:grid-cols-3">
            <Select
              label="Status"
              options={[
                { value: "", label: "All statuses" },
                { value: "PENDING", label: "Pending" },
                { value: "COMPLETED", label: "Completed" },
                { value: "CANCELLED", label: "Cancelled" },
              ]}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                resetPage();
              }}
            />
            <Select
              label="From warehouse"
              options={[
                { value: "", label: "All sources" },
                ...warehouses.map((w) => ({ value: w.id, label: w.name })),
              ]}
              value={fromWarehouse}
              onChange={(e) => {
                setFromWarehouse(e.target.value);
                resetPage();
              }}
            />
            <Select
              label="To warehouse"
              options={[
                { value: "", label: "All destinations" },
                ...warehouses.map((w) => ({ value: w.id, label: w.name })),
              ]}
              value={toWarehouse}
              onChange={(e) => {
                setToWarehouse(e.target.value);
                resetPage();
              }}
            />
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? <LoadingState /> : transfers.length === 0 ? (
            <EmptyState title="No transfers" description="Move stock from godown to shop counter." />
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#ecf1ed] text-left text-[#5c6b63]">
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">From → To</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((t) => (
                    <tr key={t.id} className="border-b border-[#f4f6f3]">
                      <td className="px-4 py-3">{t.product_name}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className="flex items-center gap-1">
                          {t.from_warehouse_name}
                          <ArrowLeftRight className="h-3 w-3" />
                          {t.to_warehouse_name}
                        </span>
                      </td>
                      <td className="px-4 py-3">{formatNumber(t.quantity)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(t.status)}>{t.status}</Badge>
                      </td>
                      <td className="px-4 py-3">{formatDate(t.created_at)}</td>
                      <td className="px-4 py-3">
                        {t.status === "PENDING" && (
                          <div className="flex gap-1">
                            <Button size="sm" onClick={() => completeTransfer(t.id).then(load)}>Complete</Button>
                            <Button size="sm" variant="secondary" onClick={() => cancelTransfer(t.id).then(load)}>Cancel</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
