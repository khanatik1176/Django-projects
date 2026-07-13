"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import {
  getPurchaseOrders,
  createPurchaseOrder,
  submitPurchaseOrder,
  receivePurchaseItem,
  cancelPurchaseOrder,
} from "@/lib/api/orders";
import { getSuppliers } from "@/lib/api/products";
import { getWarehouses } from "@/lib/api/inventory";
import { getProducts } from "@/lib/api/products";
import { PageHeader, LoadingState, EmptyState, Alert } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import type { PurchaseOrder, Supplier, Warehouse, Product } from "@/lib/types";
import { getErrorMessage } from "@/lib/api/client";

interface POForm {
  supplier: string;
  warehouse: string;
  order_date: string;
  expected_date?: string;
  items: { product: string; quantity_ordered: string; unit_cost: string }[];
}

const emptyPagination = {
  count: 0,
  total_pages: 1,
  current_page: 1,
};

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState(emptyPagination);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<POForm>({
    defaultValues: {
      order_date: new Date().toISOString().split("T")[0],
      items: [{ product: "", quantity_ordered: "", unit_cost: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const loadOrders = useCallback(async (pageNum: number, size: number) => {
    setLoading(true);
    try {
      const response = await getPurchaseOrders({
        page: String(pageNum),
        page_size: String(size),
      });
      setOrders(response.data.results);
      setPagination({
        count: response.data.count,
        total_pages: response.data.total_pages,
        current_page: response.data.current_page,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMeta = useCallback(async () => {
    try {
      const [s, w, p] = await Promise.all([
        getSuppliers({ page_size: "100" }),
        getWarehouses({ page_size: "100" }),
        getProducts({ page_size: "100" }),
      ]);
      setSuppliers(s.data.results);
      setWarehouses(w.data.results);
      setProducts(p.data.results);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    loadOrders(page, pageSize);
  }, [page, pageSize, loadOrders]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  const refresh = () => loadOrders(page, pageSize);

  const closeForm = () => {
    setShowForm(false);
    reset({
      order_date: new Date().toISOString().split("T")[0],
      items: [{ product: "", quantity_ordered: "", unit_cost: "" }],
    });
  };

  const onSubmit = async (data: POForm) => {
    setError("");
    setSubmitting(true);
    try {
      await createPurchaseOrder({
        supplier: Number(data.supplier),
        warehouse: Number(data.warehouse),
        order_date: data.order_date,
        expected_date: data.expected_date || null,
        items: data.items.map((i) => ({
          product: Number(i.product),
          quantity_ordered: i.quantity_ordered,
          unit_cost: i.unit_cost || 0,
        })),
      });
      closeForm();
      setPage(1);
      loadOrders(1, pageSize);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitPO = async (id: number) => {
    setError("");
    try {
      await submitPurchaseOrder(id);
      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleReceive = async (orderId: number, itemId: number, remaining: string) => {
    setError("");
    try {
      await receivePurchaseItem(orderId, itemId, Number(remaining));
      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm("Cancel this purchase order?")) return;
    setError("");
    try {
      await cancelPurchaseOrder(id);
      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const toggleExpand = (id: number) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const productOptions = [
    { value: "", label: "Select product..." },
    ...products.map((p) => ({ value: p.id, label: `${p.sku} — ${p.name}` })),
  ];

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        description="Procurement and inbound stock"
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            New PO
          </Button>
        }
      />

      {error && <div className="mb-4"><Alert message={error} /></div>}

      <Modal
        open={showForm}
        onClose={closeForm}
        title="Create Purchase Order"
        description="Add supplier, warehouse, and line items."
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Supplier"
              options={[{ value: "", label: "Select..." }, ...suppliers.map((s) => ({ value: s.id, label: s.name }))]}
              error={errors.supplier?.message}
              {...register("supplier", { required: "Required" })}
            />
            <Select
              label="Warehouse"
              options={[{ value: "", label: "Select..." }, ...warehouses.map((w) => ({ value: w.id, label: w.name }))]}
              error={errors.warehouse?.message}
              {...register("warehouse", { required: "Required" })}
            />
            <Input label="Order Date" type="date" {...register("order_date")} />
            <Input label="Expected Date" type="date" {...register("expected_date")} />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">Line Items</p>
            {fields.map((field, index) => (
              <div key={field.id} className="grid gap-3 rounded-lg border border-slate-100 p-3 sm:grid-cols-4">
                <Select
                  label="Product"
                  options={productOptions}
                  {...register(`items.${index}.product` as const, { required: true })}
                />
                <Input
                  label="Qty"
                  type="number"
                  {...register(`items.${index}.quantity_ordered` as const, { required: true })}
                />
                <Input
                  label="Unit Cost"
                  type="number"
                  step="0.01"
                  {...register(`items.${index}.unit_cost` as const)}
                />
                {fields.length > 1 && (
                  <div className="flex items-end">
                    <Button type="button" variant="ghost" onClick={() => remove(index)}>
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => append({ product: "", quantity_ordered: "", unit_cost: "" })}
            >
              Add Line
            </Button>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#ecf1ed] pt-4">
            <Button type="button" variant="secondary" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Create PO
            </Button>
          </div>
        </form>
      </Modal>

      <Card>
        <CardBody className="p-0">
          {loading ? (
            <LoadingState />
          ) : orders.length === 0 ? (
            <EmptyState title="No purchase orders" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b border-[#ecf1ed] text-left text-[#5c6b63]">
                      <th className="w-10 px-4 py-3" />
                      <th className="px-4 py-3 font-medium">PO Number</th>
                      <th className="px-4 py-3 font-medium">Supplier</th>
                      <th className="px-4 py-3 font-medium">Warehouse</th>
                      <th className="px-4 py-3 font-medium">Order Date</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Items</th>
                      <th className="px-4 py-3 font-medium">Total</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((po) => {
                      const expanded = expandedId === po.id;
                      return (
                        <Fragment key={po.id}>
                          <tr className="border-b border-[#f4f6f3] hover:bg-[#f8faf8]">
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => toggleExpand(po.id)}
                                className="rounded p-1 text-[#5c6b63] hover:bg-[#ecf1ed]"
                                aria-label={expanded ? "Collapse row" : "Expand row"}
                              >
                                {expanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-3 font-medium text-[#14201a]">{po.po_number}</td>
                            <td className="px-4 py-3 text-[#5c6b63]">{po.supplier_name}</td>
                            <td className="px-4 py-3 text-[#5c6b63]">{po.warehouse_name}</td>
                            <td className="px-4 py-3 text-[#5c6b63]">{formatDate(po.order_date)}</td>
                            <td className="px-4 py-3">
                              <Badge variant={statusVariant(po.status)}>
                                {po.status.replace(/_/g, " ")}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-[#5c6b63]">{po.items.length}</td>
                            <td className="px-4 py-3 font-medium">{formatCurrency(po.total_cost)}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                {po.status === "DRAFT" && (
                                  <Button size="sm" onClick={() => handleSubmitPO(po.id)}>
                                    Submit
                                  </Button>
                                )}
                                {!["RECEIVED", "CANCELLED"].includes(po.status) && (
                                  <Button size="sm" variant="ghost" onClick={() => handleCancel(po.id)}>
                                    Cancel
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {expanded && (
                            <tr className="bg-[#f8faf8]">
                              <td colSpan={9} className="px-4 py-3">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-left text-[#5c6b63]">
                                      <th className="pb-2 pr-4 font-medium">Product</th>
                                      <th className="pb-2 pr-4 font-medium">SKU</th>
                                      <th className="pb-2 pr-4 font-medium">Ordered</th>
                                      <th className="pb-2 pr-4 font-medium">Received</th>
                                      <th className="pb-2 pr-4 font-medium">Remaining</th>
                                      <th className="pb-2 font-medium">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {po.items.map((item) => (
                                      <tr key={item.id} className="border-t border-[#ecf1ed]">
                                        <td className="py-2 pr-4">{item.product_name}</td>
                                        <td className="py-2 pr-4 font-mono text-xs text-[#5c6b63]">
                                          {item.product_sku}
                                        </td>
                                        <td className="py-2 pr-4">{formatNumber(item.quantity_ordered)}</td>
                                        <td className="py-2 pr-4">{formatNumber(item.quantity_received)}</td>
                                        <td className="py-2 pr-4">{formatNumber(item.quantity_remaining)}</td>
                                        <td className="py-2">
                                          {Number(item.quantity_remaining) > 0 &&
                                            ["SUBMITTED", "PARTIALLY_RECEIVED"].includes(po.status) && (
                                            <Button
                                              size="sm"
                                              variant="secondary"
                                              onClick={() =>
                                                handleReceive(po.id, item.id, item.quantity_remaining)
                                              }
                                            >
                                              Receive All
                                            </Button>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={pagination.current_page}
                totalPages={pagination.total_pages}
                totalCount={pagination.count}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={handlePageSizeChange}
              />
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
