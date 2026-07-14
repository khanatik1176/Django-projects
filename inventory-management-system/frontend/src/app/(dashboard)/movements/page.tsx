"use client";

import { useCallback, useEffect, useState } from "react";
import { getMovements, getWarehouses } from "@/lib/api/inventory";
import { PageHeader, LoadingState, EmptyState } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { useServerPagination } from "@/hooks/useServerPagination";
import { formatDate, formatNumber } from "@/lib/utils";
import type { StockMovement, Warehouse } from "@/lib/types";
import { getErrorMessage } from "@/lib/api/client";

const MOVEMENT_TYPES = [
  { value: "", label: "All types" },
  { value: "RECEIPT", label: "Receipt" },
  { value: "ISSUE", label: "Issue" },
  { value: "ADJUSTMENT", label: "Adjustment" },
  { value: "TRANSFER_IN", label: "Transfer in" },
  { value: "TRANSFER_OUT", label: "Transfer out" },
];

export default function MovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [movementType, setMovementType] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [search, setSearch] = useState("");
  const {
    page,
    setPage,
    pageSize,
    onPageSizeChange,
    pagination,
    applyResponse,
    resetPage,
  } = useServerPagination(10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        page_size: String(pageSize),
      };
      if (movementType) params.movement_type = movementType;
      if (warehouseId) params.warehouse = warehouseId;
      if (search) params.search = search;

      const res = await getMovements(params);
      setMovements(res.data.results);
      applyResponse(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, movementType, warehouseId, search, applyResponse]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    getWarehouses({ page_size: "100" })
      .then((r) => setWarehouses(r.data.results))
      .catch(() => {});
  }, []);

  return (
    <div>
      <PageHeader
        title="Stock Movements"
        description="Audit trail of all inventory changes"
      />

      {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}

      <Card>
        <CardHeader>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              placeholder="Search product, SKU, reference, notes..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
            />
            <Select
              options={MOVEMENT_TYPES}
              value={movementType}
              onChange={(e) => {
                setMovementType(e.target.value);
                resetPage();
              }}
            />
            <Select
              options={[
                { value: "", label: "All warehouses" },
                ...warehouses.map((w) => ({ value: w.id, label: w.name })),
              ]}
              value={warehouseId}
              onChange={(e) => {
                setWarehouseId(e.target.value);
                resetPage();
              }}
            />
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? <LoadingState /> : movements.length === 0 ? (
            <EmptyState title="No movements yet" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-slate-500">
                      <th className="px-6 py-3 font-medium">Date</th>
                      <th className="px-6 py-3 font-medium">Product</th>
                      <th className="px-6 py-3 font-medium">Warehouse</th>
                      <th className="px-6 py-3 font-medium">Type</th>
                      <th className="px-6 py-3 font-medium">Qty</th>
                      <th className="px-6 py-3 font-medium">Before → After</th>
                      <th className="px-6 py-3 font-medium">Reference</th>
                      <th className="px-6 py-3 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m) => (
                      <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="px-6 py-3 text-slate-600">{formatDate(m.created_at)}</td>
                        <td className="px-6 py-3">
                          <p className="font-medium">{m.product_name}</p>
                          <p className="text-xs text-slate-500">{m.product_sku}</p>
                        </td>
                        <td className="px-6 py-3">{m.warehouse_name}</td>
                        <td className="px-6 py-3">
                          <Badge variant={statusVariant(m.movement_type)}>
                            {m.movement_type.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="px-6 py-3">{formatNumber(m.quantity)}</td>
                        <td className="px-6 py-3 text-slate-600">
                          {formatNumber(m.quantity_before)} → {formatNumber(m.quantity_after)}
                        </td>
                        <td className="px-6 py-3 font-mono text-xs text-slate-600">
                          {m.reference_number || "—"}
                        </td>
                        <td className="px-6 py-3 text-slate-600">{m.notes || "—"}</td>
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
