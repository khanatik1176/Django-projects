"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock, PackagePlus, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/PageHeader";
import { StockHealthBadge } from "@/components/inventory/StockHealthBadge";
import { getStockDetail, manageStock } from "@/lib/api/inventory";
import { formatDate, formatNumber } from "@/lib/utils";
import type { Stock, StockDetail } from "@/lib/types";
import { getErrorMessage } from "@/lib/api/client";

export function StockUpdateModal({
  stock,
  open,
  onClose,
  onUpdated,
}: {
  stock: Stock | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [detail, setDetail] = useState<StockDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [reorderLevel, setReorderLevel] = useState("");
  const [maxLevel, setMaxLevel] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [topUpQty, setTopUpQty] = useState("");
  const [topUpExpiry, setTopUpExpiry] = useState("");
  const [topUpBatch, setTopUpBatch] = useState("");
  const [writeOffNotes, setWriteOffNotes] = useState("");
  const [includeExpiringSoon, setIncludeExpiringSoon] = useState(false);

  useEffect(() => {
    if (!open || !stock) return;
    setError("");
    setLoading(true);
    getStockDetail(stock.id)
      .then((res) => {
        const d = res.data;
        setDetail(d);
        setReorderLevel(d.reorder_level ?? "0");
        setMaxLevel(d.max_stock_level ?? "");
        setNewQuantity(d.quantity ?? "0");
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [open, stock]);

  const runAction = async (action: string, payload: Record<string, unknown>, key: string) => {
    if (!stock) return;
    setError("");
    setSubmitting(key);
    try {
      await manageStock(stock.id, { action, ...payload });
      onUpdated();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(null);
    }
  };

  const health = detail?.health_status ?? stock?.health_status;
  const batches = detail?.batches ?? [];
  const hasExpiredBatches = batches.some((b) => b.is_expired);
  const hasExpiringBatches = batches.some(
    (b) => !b.is_expired && b.days_left != null && b.days_left <= 7,
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Update stock"
      description={
        stock
          ? `${stock.product_name} · ${stock.warehouse_name}`
          : "Edit thresholds, quantity, or handle expiry"
      }
      size="xl"
    >
      {error && (
        <div className="mb-4">
          <Alert message={error} />
        </div>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-[#5c6b63]">Loading stock details…</p>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#ecf1ed] bg-[#f8faf8] px-4 py-3">
            <StockHealthBadge
              status={detail?.health_status ?? stock?.health_status}
              label={detail?.health_label ?? stock?.health_label}
              daysToExpiry={detail?.days_to_expiry ?? stock?.days_to_expiry}
            />
            <span className="text-sm text-[#5c6b63]">
              On hand: <strong className="text-[#14201a]">{formatNumber(detail?.quantity ?? stock?.quantity ?? 0)}</strong>
            </span>
            {health === "LOW_STOCK" && (
              <span className="flex items-center gap-1 text-xs font-medium text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                Shelf needs restock
              </span>
            )}
            {(health === "EXPIRING_SOON" || hasExpiredBatches) && (
              <span className="flex items-center gap-1 text-xs font-medium text-rose-700">
                <Clock className="h-3.5 w-3.5" />
                Check expiry / write off
              </span>
            )}
          </div>

          {/* Reorder thresholds */}
          <section className="rounded-xl border border-[#ecf1ed] p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[#14201a]">
              <Pencil className="h-4 w-4 text-[#0b6e4f]" />
              Reorder levels
            </h3>
            <p className="mt-1 text-xs text-[#5c6b63]">
              Set when this item shows as low stock on the shelf.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Input
                label="Reorder level"
                type="number"
                step="0.01"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
              />
              <Input
                label="Max stock level (optional)"
                type="number"
                step="0.01"
                value={maxLevel}
                onChange={(e) => setMaxLevel(e.target.value)}
              />
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                size="sm"
                loading={submitting === "thresholds"}
                onClick={() =>
                  runAction(
                    "update_thresholds",
                    {
                      reorder_level: reorderLevel,
                      max_stock_level: maxLevel || null,
                    },
                    "thresholds",
                  )
                }
              >
                Save levels
              </Button>
            </div>
          </section>

          {/* Adjust quantity */}
          <section className="rounded-xl border border-[#ecf1ed] p-4">
            <h3 className="text-sm font-semibold text-[#14201a]">Correct on-hand quantity</h3>
            <p className="mt-1 text-xs text-[#5c6b63]">
              After a physical shelf count or audit.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Input
                label="New quantity"
                type="number"
                step="0.01"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
              />
              <Input
                label="Reason / notes"
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                placeholder="Physical count correction"
              />
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                size="sm"
                variant="secondary"
                loading={submitting === "adjust"}
                onClick={() =>
                  runAction(
                    "adjust_quantity",
                    { new_quantity: newQuantity, notes: adjustNotes },
                    "adjust",
                  )
                }
              >
                Update quantity
              </Button>
            </div>
          </section>

          {/* Top up — low stock */}
          {(health === "LOW_STOCK" ||
            health === "OUT_OF_STOCK" ||
            health === "ADEQUATE") && (
            <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#14201a]">
                <PackagePlus className="h-4 w-4 text-amber-700" />
                Top up shelf (restock)
              </h3>
              <p className="mt-1 text-xs text-[#5c6b63]">
                Add stock when the shelf is running low.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Input
                  label="Quantity to add"
                  type="number"
                  step="0.01"
                  value={topUpQty}
                  onChange={(e) => setTopUpQty(e.target.value)}
                />
                {detail?.is_perishable && (
                  <>
                    <Input
                      label="Expiry date"
                      type="date"
                      value={topUpExpiry}
                      onChange={(e) => setTopUpExpiry(e.target.value)}
                    />
                    <Input
                      label="Batch / lot #"
                      value={topUpBatch}
                      onChange={(e) => setTopUpBatch(e.target.value)}
                    />
                  </>
                )}
              </div>
              <div className="mt-3 flex justify-end">
                <Button
                  size="sm"
                  loading={submitting === "topup"}
                  disabled={!topUpQty}
                  onClick={() =>
                    runAction(
                      "top_up",
                      {
                        quantity: topUpQty,
                        expiry_date: topUpExpiry || undefined,
                        batch_number: topUpBatch,
                        notes: "Shelf restock by manager",
                      },
                      "topup",
                    )
                  }
                >
                  Add to stock
                </Button>
              </div>
            </section>
          )}

          {/* Write off expired */}
          {(hasExpiredBatches || hasExpiringBatches || health === "EXPIRING_SOON") && (
            <section className="rounded-xl border border-rose-200 bg-rose-50/40 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#14201a]">
                <Trash2 className="h-4 w-4 text-rose-700" />
                Write off expired / damaged
              </h3>
              {batches.length > 0 && (
                <div className="mt-3 overflow-x-auto rounded-lg border border-rose-100 bg-white">
                  <table className="w-full min-w-[400px] text-xs">
                    <thead>
                      <tr className="border-b border-rose-100 text-left text-[#5c6b63]">
                        <th className="px-3 py-2">Batch</th>
                        <th className="px-3 py-2">Qty</th>
                        <th className="px-3 py-2">Expiry</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batches.map((b) => (
                        <tr key={b.id} className="border-b border-rose-50">
                          <td className="px-3 py-2">{b.batch_number || `#${b.id}`}</td>
                          <td className="px-3 py-2">{formatNumber(b.quantity)}</td>
                          <td className="px-3 py-2">
                            {b.expiry_date ? formatDate(b.expiry_date) : "—"}
                          </td>
                          <td className="px-3 py-2">
                            {b.is_expired ? (
                              <span className="font-semibold text-rose-700">Expired</span>
                            ) : (
                              <span className="text-amber-700">{b.days_left}d left</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <label className="mt-3 flex items-center gap-2 text-xs text-[#5c6b63]">
                <input
                  type="checkbox"
                  checked={includeExpiringSoon}
                  onChange={(e) => setIncludeExpiringSoon(e.target.checked)}
                  className="rounded"
                />
                Also write off batches expiring within 7 days
              </label>
              <Input
                label="Notes"
                className="mt-3"
                value={writeOffNotes}
                onChange={(e) => setWriteOffNotes(e.target.value)}
                placeholder="Disposed expired milk — shop floor"
              />
              <div className="mt-3 flex justify-end">
                <Button
                  size="sm"
                  variant="danger"
                  loading={submitting === "writeoff"}
                  onClick={() =>
                    runAction(
                      "write_off_expired",
                      {
                        notes: writeOffNotes,
                        include_expiring_soon: includeExpiringSoon,
                      },
                      "writeoff",
                    )
                  }
                >
                  Write off stock
                </Button>
              </div>
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}
