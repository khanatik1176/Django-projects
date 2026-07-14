"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import {
  getSalesOrders,
  createSalesOrder,
  confirmSalesOrder,
  fulfillSalesItem,
  cancelSalesOrder,
} from "@/lib/api/orders";
import { getCustomers, type Customer } from "@/lib/api/customers";
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
import type { SalesOrder, Warehouse, Product } from "@/lib/types";
import { getErrorMessage } from "@/lib/api/client";

interface SOForm {
  hal_khata_customer?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  warehouse: string;
  order_date: string;
  items: { product: string; quantity_ordered: string; unit_price: string }[];
}

function hasReservedField(items: SalesOrder["items"]) {
  return items.some((item) => item.quantity_reserved !== undefined);
}

const emptyPagination = {
  count: 0,
  total_pages: 1,
  current_page: 1,
};

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [khataCustomers, setKhataCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState(emptyPagination);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { register, handleSubmit, control, reset, setValue } = useForm<SOForm>({
    defaultValues: {
      order_date: new Date().toISOString().split("T")[0],
      items: [{ product: "", quantity_ordered: "", unit_price: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const loadOrders = useCallback(async (pageNum: number, size: number) => {
    setLoading(true);
    try {
      const response = await getSalesOrders({
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
      const [w, p, c] = await Promise.all([
        getWarehouses({ page_size: "100" }),
        getProducts({ page_size: "100" }),
        getCustomers({ page_size: "200", ordering: "name" }),
      ]);
      setWarehouses(w.data.results);
      setProducts(p.data.results);
      setKhataCustomers(c.data.results);
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
      items: [{ product: "", quantity_ordered: "", unit_price: "" }],
    });
  };

  const onSubmit = async (data: SOForm) => {
    setError("");
    setSubmitting(true);
    try {
      await createSalesOrder({
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        warehouse: Number(data.warehouse),
        order_date: data.order_date,
        items: data.items.map((i) => ({
          product: Number(i.product),
          quantity_ordered: i.quantity_ordered,
          unit_price: i.unit_price || 0,
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

  const handleConfirm = async (id: number) => {
    setError("");
    try {
      await confirmSalesOrder(id);
      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleFulfill = async (orderId: number, itemId: number, remaining: string) => {
    setError("");
    try {
      await fulfillSalesItem(orderId, itemId, Number(remaining));
      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm("Cancel this sales order? Reserved stock will be released.")) return;
    setError("");
    try {
      await cancelSalesOrder(id);
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
        title="Sales Orders"
        description="Outbound orders with stock reservation"
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            New SO
          </Button>
        }
      />

      {error && <div className="mb-4"><Alert message={error} /></div>}

      <Modal
        open={showForm}
        onClose={closeForm}
        title="Create Sales Order"
        description="Confirm later to reserve available warehouse stock."
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Hal Khata customer (optional)"
              options={[
                { value: "", label: "Manual entry..." },
                ...khataCustomers.map((c) => ({
                  value: c.id,
                  label: `${c.name}${c.phone ? ` · ${c.phone}` : ""}`,
                })),
              ]}
              {...register("hal_khata_customer")}
              onChange={(e) => {
                const id = e.target.value;
                setValue("hal_khata_customer", id);
                if (!id) return;
                const customer = khataCustomers.find((c) => String(c.id) === id);
                if (customer) {
                  setValue("customer_name", customer.name);
                  setValue("customer_phone", customer.phone ?? "");
                }
              }}
            />
            <Input label="Customer Name" {...register("customer_name", { required: true })} />
            <Input label="Email" type="email" {...register("customer_email")} />
            <Input label="Phone" {...register("customer_phone")} />
            <Select
              label="Warehouse"
              options={[{ value: "", label: "Select..." }, ...warehouses.map((w) => ({ value: w.id, label: w.name }))]}
              {...register("warehouse", { required: true })}
            />
            <Input label="Order Date" type="date" {...register("order_date")} />
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
                  label="Unit Price"
                  type="number"
                  step="0.01"
                  {...register(`items.${index}.unit_price` as const)}
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
              onClick={() => append({ product: "", quantity_ordered: "", unit_price: "" })}
            >
              Add Line
            </Button>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#ecf1ed] pt-4">
            <Button type="button" variant="secondary" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Create SO
            </Button>
          </div>
        </form>
      </Modal>

      <Card>
        <CardBody className="p-0">
          {loading ? (
            <LoadingState />
          ) : orders.length === 0 ? (
            <EmptyState title="No sales orders" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b border-[#ecf1ed] text-left text-[#5c6b63]">
                      <th className="w-10 px-4 py-3" />
                      <th className="px-4 py-3 font-medium">SO Number</th>
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium">Warehouse</th>
                      <th className="px-4 py-3 font-medium">Order Date</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Items</th>
                      <th className="px-4 py-3 font-medium">Total</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((so) => {
                      const expanded = expandedId === so.id;
                      return (
                        <Fragment key={so.id}>
                          <tr className="border-b border-[#f4f6f3] hover:bg-[#f8faf8]">
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => toggleExpand(so.id)}
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
                            <td className="px-4 py-3 font-medium text-[#14201a]">{so.so_number}</td>
                            <td className="px-4 py-3 text-[#5c6b63]">{so.customer_name}</td>
                            <td className="px-4 py-3 text-[#5c6b63]">{so.warehouse_name}</td>
                            <td className="px-4 py-3 text-[#5c6b63]">{formatDate(so.order_date)}</td>
                            <td className="px-4 py-3">
                              <Badge variant={statusVariant(so.status)}>
                                {so.status.replace(/_/g, " ")}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-[#5c6b63]">{so.items.length}</td>
                            <td className="px-4 py-3 font-medium">{formatCurrency(so.total_revenue)}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                {so.status === "DRAFT" && (
                                  <Button size="sm" onClick={() => handleConfirm(so.id)}>
                                    Confirm
                                  </Button>
                                )}
                                {!["FULFILLED", "CANCELLED"].includes(so.status) && (
                                  <Button size="sm" variant="ghost" onClick={() => handleCancel(so.id)}>
                                    Cancel
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {expanded && (
                            <tr className="bg-[#f8faf8]">
                              <td colSpan={9} className="px-4 py-3">
                                {so.status === "DRAFT" && (
                                  <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                    Confirm this order to reserve available warehouse stock for each line item.
                                  </p>
                                )}
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-left text-[#5c6b63]">
                                      <th className="pb-2 pr-4 font-medium">Product</th>
                                      <th className="pb-2 pr-4 font-medium">SKU</th>
                                      <th className="pb-2 pr-4 font-medium">Ordered</th>
                                      {hasReservedField(so.items) && (
                                        <th className="pb-2 pr-4 font-medium">Reserved</th>
                                      )}
                                      <th className="pb-2 pr-4 font-medium">Fulfilled</th>
                                      <th className="pb-2 pr-4 font-medium">Remaining</th>
                                      <th className="pb-2 font-medium">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {so.items.map((item) => (
                                      <tr key={item.id} className="border-t border-[#ecf1ed]">
                                        <td className="py-2 pr-4">{item.product_name}</td>
                                        <td className="py-2 pr-4 font-mono text-xs text-[#5c6b63]">
                                          {item.product_sku}
                                        </td>
                                        <td className="py-2 pr-4">{formatNumber(item.quantity_ordered)}</td>
                                        {hasReservedField(so.items) && (
                                          <td className="py-2 pr-4">
                                            {formatNumber(item.quantity_reserved ?? "0")}
                                          </td>
                                        )}
                                        <td className="py-2 pr-4">{formatNumber(item.quantity_fulfilled)}</td>
                                        <td className="py-2 pr-4">{formatNumber(item.quantity_remaining)}</td>
                                        <td className="py-2">
                                          {Number(item.quantity_remaining) > 0 &&
                                            ["CONFIRMED", "PARTIALLY_FULFILLED"].includes(so.status) && (
                                            <Button
                                              size="sm"
                                              variant="secondary"
                                              onClick={() =>
                                                handleFulfill(so.id, item.id, item.quantity_remaining)
                                              }
                                            >
                                              Fulfill All
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
