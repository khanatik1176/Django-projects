"use client";

import { useEffect, useState } from "react";
import { getAbcAnalysis, getMovementSummary, getStockValuation } from "@/lib/api/extras";
import { PageHeader, LoadingState, Alert } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { SimpleBarChart } from "@/components/dashboard/SimpleCharts";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api/client";

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [valuation, setValuation] = useState<{
    grand_total: string;
    items: {
      product_id: number;
      product_name: string;
      warehouse_id: number;
      warehouse_name: string;
      total_value: string;
    }[];
  } | null>(null);
  const [abc, setAbc] = useState<{ products: { product_name: string; classification: string; total_value: string }[] } | null>(null);
  const [movements, setMovements] = useState<{ by_type: { movement_type: string; total_quantity: string }[] } | null>(null);

  useEffect(() => {
    Promise.all([getStockValuation(), getAbcAnalysis(), getMovementSummary()])
      .then(([val, abcRes, mov]) => {
        setValuation(val.data as typeof valuation);
        setAbc(abcRes.data as typeof abc);
        setMovements(mov.data as typeof movements);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  const topValue = (valuation?.items ?? [])
    .sort((a, b) => Number(b.total_value) - Number(a.total_value))
    .slice(0, 6)
    .map((item, i) => {
      const base =
        item.product_name.length > 14
          ? `${item.product_name.slice(0, 14)}…`
          : item.product_name;
      const warehouse =
        item.warehouse_name.length > 10
          ? `${item.warehouse_name.slice(0, 10)}…`
          : item.warehouse_name;
      return {
        id: `${item.product_id}-${item.warehouse_id}`,
        label: `${base} · ${warehouse}`,
        value: Number(item.total_value),
        color: ["#0b6e4f", "#1a9d6c", "#5ee0b0", "#f59e0b", "#0ea5e9", "#8b5cf6"][i % 6],
      };
    });

  const abcChart = (abc?.products ?? [])
    .reduce<Record<string, number>>((acc, p) => {
      acc[p.classification] = (acc[p.classification] ?? 0) + Number(p.total_value);
      return acc;
    }, {});

  return (
    <div className="space-y-5">
      <PageHeader
        title="Shop Reports"
        description="Valuation, ABC analysis & movement summary for smarter buying"
      />

      {error && <Alert message={error} />}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs text-[#5c6b63]">Total inventory value</p>
            <p className="mt-1 text-2xl font-bold text-[#14201a]">
              {formatCurrency(valuation?.grand_total ?? 0)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-[#5c6b63]">A-class SKUs (top 80% value)</p>
            <p className="mt-1 text-2xl font-bold text-[#14201a]">
              {(abc?.products ?? []).filter((p) => p.classification === "A").length}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-[#5c6b63]">Movement types tracked</p>
            <p className="mt-1 text-2xl font-bold text-[#14201a]">
              {movements?.by_type?.length ?? 0}
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Top products by value</h2>
          </CardHeader>
          <CardBody>
            {topValue.length === 0 ? (
              <p className="text-sm text-[#5c6b63]">No valuation data.</p>
            ) : (
              <SimpleBarChart items={topValue} valueFormatter={(v) => formatCurrency(v)} />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">ABC classification value</h2>
          </CardHeader>
          <CardBody>
            <SimpleBarChart
              items={Object.entries(abcChart).map(([label, value], i) => ({
                id: `class-${label}`,
                label: `Class ${label}`,
                value,
                color: ["#0b6e4f", "#f59e0b", "#94a3b8"][i % 3],
              }))}
              valueFormatter={(v) => formatCurrency(v)}
            />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Movement summary by type</h2>
        </CardHeader>
        <CardBody className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#ecf1ed] text-left text-[#5c6b63]">
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Total quantity moved</th>
              </tr>
            </thead>
            <tbody>
              {(movements?.by_type ?? []).map((row) => (
                <tr key={row.movement_type} className="border-b border-[#f4f6f3]">
                  <td className="px-4 py-3">{row.movement_type.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3">{formatNumber(row.total_quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
