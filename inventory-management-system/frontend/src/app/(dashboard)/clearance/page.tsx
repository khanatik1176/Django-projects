"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Percent, ShoppingCart, Sparkles, Trash2 } from "lucide-react";
import { getClearanceHub } from "@/lib/api/extras";
import { getStockDetail, manageStock } from "@/lib/api/inventory";
import { PageHeader, LoadingState, Alert } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import type { ClearanceHub, ClearanceItem } from "@/lib/types";
import { getErrorMessage } from "@/lib/api/client";

export default function ClearancePage() {
  const router = useRouter();
  const [data, setData] = useState<ClearanceHub | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionKey, setActionKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getClearanceHub();
      setData(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sellAtClearance = async (item: ClearanceItem) => {
    setActionKey(`${item.stock_id}-sell`);
    setError("");
    setSuccess("");
    try {
      const stock = await getStockDetail(item.stock_id);
      const params = new URLSearchParams({
        product: String(stock.data.product),
        warehouse: String(stock.data.warehouse),
        unit_price: item.clearance_price,
        qty: "1",
      });
      router.push(`/pos?${params.toString()}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionKey(null);
    }
  };

  const writeOff = async (item: ClearanceItem) => {
    setActionKey(`${item.stock_id}-writeoff`);
    setError("");
    setSuccess("");
    try {
      await manageStock(item.stock_id, {
        action: "write_off_expired",
        notes: "Clearance write-off",
      });
      setSuccess(`${item.product_name} written off successfully.`);
      const res = await getClearanceHub();
      setData(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionKey(null);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Clearance"
        description="Near-expiry markdown suggestions — reduce waste before write-off"
      />

      {error && <Alert message={error} />}
      {success && <Alert type="success" message={success} />}

      {data && (
        <>
          <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-white">
            <CardBody className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                  <Sparkles className="h-4 w-4" />
                  {data.tip}
                </p>
                <p className="mt-2 text-2xl font-bold text-[#14201a]">
                  {data.expiring_count} batches at risk · {formatCurrency(data.total_at_risk_value)}
                </p>
              </div>
              <Link href="/stock" className="text-sm font-semibold text-[#0b6e4f]">
                Manage stock →
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold">মেয়াদ শেষ হচ্ছে — suggested ছাড়</h2>
            </CardHeader>
            <CardBody className="p-0">
              {data.expiring_items.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-[#5c6b63]">No expiring items in the next 14 days.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#ecf1ed] text-left text-[#5c6b63]">
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Expiry</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3">ছাড়</th>
                      <th className="px-4 py-3">Clearance price</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.expiring_items.map((item) => (
                      <tr key={item.batch_id} className="border-b border-[#f4f6f3]">
                        <td className="px-4 py-3">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-xs text-[#5c6b63]">{item.warehouse_name}</p>
                        </td>
                        <td className="px-4 py-3">
                          {formatDate(item.expiry_date)}
                          <p className={`text-xs ${item.is_expired ? "text-rose-600" : "text-amber-700"}`}>
                            {item.days_left}d left
                          </p>
                        </td>
                        <td className="px-4 py-3">{formatNumber(item.quantity)}</td>
                        <td className="px-4 py-3">
                          <Badge variant="warning">
                            <Percent className="mr-1 inline h-3 w-3" />
                            {item.suggested_discount_percent}%
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#0b6e4f]">
                            {formatCurrency(item.clearance_price)}
                          </p>
                          {Number(item.clearance_price) < Number(item.selling_price) && (
                            <p className="text-xs text-[#5c6b63] line-through">
                              {formatCurrency(item.selling_price)}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              loading={actionKey === `${item.stock_id}-sell`}
                              disabled={!!actionKey}
                              onClick={() => sellAtClearance(item)}
                            >
                              <ShoppingCart className="h-3.5 w-3.5" />
                              Sell at clearance
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              loading={actionKey === `${item.stock_id}-writeoff`}
                              disabled={!!actionKey}
                              onClick={() => writeOff(item)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Write off
                            </Button>
                          </div>
                          <p className="mt-1.5 text-xs text-[#5c6b63]">{item.action}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>

          {data.dead_stock.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Dead stock — no movement 30 days
                </h2>
              </CardHeader>
              <CardBody className="divide-y divide-[#ecf1ed] p-0">
                {data.dead_stock.map((item) => (
                  <div key={item.stock_id} className="flex justify-between px-4 py-3 text-sm">
                    <span>{item.product_name} · {item.warehouse_name}</span>
                    <span className="text-[#5c6b63]">{formatNumber(item.quantity)} on hand</span>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
