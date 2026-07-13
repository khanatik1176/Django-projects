"use client";

import { useCallback, useEffect, useState } from "react";
import { getMovements } from "@/lib/api/inventory";
import { PageHeader, LoadingState, EmptyState } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { useServerPagination } from "@/hooks/useServerPagination";
import { formatDate, formatNumber } from "@/lib/utils";
import type { StockMovement } from "@/lib/types";
import { getErrorMessage } from "@/lib/api/client";

export default function MovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const {
    page,
    setPage,
    pageSize,
    onPageSizeChange,
    pagination,
    applyResponse,
  } = useServerPagination(10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMovements({
        page: String(page),
        page_size: String(pageSize),
      });
      setMovements(res.data.results);
      applyResponse(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, applyResponse]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Stock Movements"
        description="Audit trail of all inventory changes"
      />

      {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}

      <Card>
        <CardBody className="p-0">
          {loading ? <LoadingState /> : movements.length === 0 ? (
            <EmptyState title="No movements yet" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-slate-500">
                      <th className="px-6 py-3 font-medium">Date</th>
                      <th className="px-6 py-3 font-medium">Product</th>
                      <th className="px-6 py-3 font-medium">Warehouse</th>
                      <th className="px-6 py-3 font-medium">Type</th>
                      <th className="px-6 py-3 font-medium">Qty</th>
                      <th className="px-6 py-3 font-medium">Before → After</th>
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
                            {m.movement_type.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="px-6 py-3">{formatNumber(m.quantity)}</td>
                        <td className="px-6 py-3 text-slate-600">
                          {formatNumber(m.quantity_before)} → {formatNumber(m.quantity_after)}
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
