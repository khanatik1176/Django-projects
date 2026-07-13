"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Boxes,
  DollarSign,
  AlertTriangle,
  ShoppingCart,
  Truck,
  Warehouse,
  ArrowRight,
  Package,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  getDashboard,
  getLowStock,
  getMovements,
  getShopInsights,
  getStock,
} from "@/lib/api/inventory";
import { getPurchaseOrders, getSalesOrders } from "@/lib/api/orders";
import { PageHeader, LoadingState, Alert } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DashboardStockTabs } from "@/components/dashboard/DashboardStockTabs";
import { RoleInsightsPanel } from "@/components/dashboard/RoleInsightsPanel";
import {
  MiniSparkline,
  SimpleBarChart,
  SimpleDonutChart,
} from "@/components/dashboard/SimpleCharts";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type {
  DashboardData,
  PurchaseOrder,
  SalesOrder,
  ShopInsights,
  Stock,
  StockMovement,
} from "@/lib/types";
import { getErrorMessage } from "@/lib/api/client";

const stats: {
  key: Exclude<keyof DashboardData, "health_summary" | "total_stock_records" | "pending_transfers">;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  currency?: boolean;
  warn?: boolean;
}[] = [
  { key: "total_warehouses", label: "Warehouses", icon: Warehouse },
  { key: "total_units_on_hand", label: "Units on Hand", icon: Boxes },
  {
    key: "total_inventory_value",
    label: "Inventory Value",
    icon: DollarSign,
    currency: true,
  },
  {
    key: "low_stock_items",
    label: "Low Stock Items",
    icon: AlertTriangle,
    warn: true,
  },
  {
    key: "expiring_soon_items",
    label: "Expiring Soon",
    icon: Clock,
    warn: true,
  },
  { key: "open_purchase_orders", label: "Open POs", icon: ShoppingCart },
  { key: "open_sales_orders", label: "Open SOs", icon: Truck },
];

const CHART_COLORS = ["#0b6e4f", "#1a9d6c", "#5ee0b0", "#f59e0b", "#0ea5e9", "#8b5cf6"];

function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray((data as { results: T[] }).results)
  ) {
    return (data as { results: T[] }).results;
  }
  return [];
}

function aggregateByWarehouse(stock: Stock[]) {
  const map = new Map<string, number>();
  for (const row of stock) {
    map.set(row.warehouse_name, (map.get(row.warehouse_name) ?? 0) + Number(row.quantity));
  }
  return [...map.entries()]
    .map(([label, value], i) => ({
      label,
      value,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

function aggregateTopProducts(stock: Stock[]) {
  const map = new Map<string, number>();
  for (const row of stock) {
    map.set(row.product_name, (map.get(row.product_name) ?? 0) + Number(row.quantity));
  }
  return [...map.entries()]
    .map(([label, value], i) => ({
      label: label.length > 22 ? `${label.slice(0, 22)}…` : label,
      value,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

function aggregateMovementTypes(movements: StockMovement[]) {
  const map = new Map<string, number>();
  for (const row of movements) {
    const key = row.movement_type.replace(/_/g, " ");
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].map(([label, value], i) => ({
    label,
    value,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
}

function aggregateOrderStatuses(
  purchaseOrders: PurchaseOrder[],
  salesOrders: SalesOrder[],
) {
  const map = new Map<string, number>();
  for (const po of purchaseOrders) {
    const key = `PO · ${po.status.replace(/_/g, " ")}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  for (const so of salesOrders) {
    const key = `SO · ${so.status.replace(/_/g, " ")}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].map(([label, value], i) => ({
    label,
    value,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
}

function movementSparkline(movements: StockMovement[]) {
  const days = 7;
  const buckets = Array.from({ length: days }, () => 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (const m of movements) {
    const date = new Date(m.created_at);
    date.setHours(0, 0, 0, 0);
    const diff = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (diff >= 0 && diff < days) {
      buckets[days - 1 - diff] += Number(m.quantity);
    }
  }
  return buckets;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [lowStock, setLowStock] = useState<Stock[]>([]);
  const [stock, setStock] = useState<Stock[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [insights, setInsights] = useState<ShopInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deskOpen, setDeskOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      getDashboard(),
      getLowStock(),
      getStock({ page_size: "100" }),
      getMovements({ page_size: "50" }),
      getPurchaseOrders({ page_size: "50" }),
      getSalesOrders({ page_size: "50" }),
      getShopInsights(),
    ])
      .then(([dash, low, stk, mov, po, so, ins]) => {
        setData(dash.data);
        setLowStock(unwrapList<Stock>(low.data));
        setStock(stk.data.results);
        setMovements(mov.data.results);
        setPurchaseOrders(po.data.results);
        setSalesOrders(so.data.results);
        setInsights(ins.data);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const warehouseChart = useMemo(() => aggregateByWarehouse(stock), [stock]);
  const productChart = useMemo(() => aggregateTopProducts(stock), [stock]);
  const movementChart = useMemo(() => aggregateMovementTypes(movements), [movements]);
  const orderChart = useMemo(
    () => aggregateOrderStatuses(purchaseOrders, salesOrders),
    [purchaseOrders, salesOrders],
  );
  const sparkline = useMemo(() => movementSparkline(movements), [movements]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Operations overview"
        description="Live stock health, expiry alerts & role-based shop intelligence"
        action={
          insights ? (
            <button
              type="button"
              onClick={() => setDeskOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-[#0b6e4f]/25 bg-[#e6f4ee] px-3.5 py-2 text-sm font-semibold text-[#0b6e4f] transition hover:border-[#0b6e4f]/40 hover:bg-[#d4ede2]"
              aria-label={`Open ${insights.role_name} desk`}
            >
              <Sparkles className="h-4 w-4" />
              <span>{insights.role_name} desk</span>
            </button>
          ) : undefined
        }
      />

      {error && <Alert message={error} />}

      <Modal
        open={deskOpen}
        onClose={() => setDeskOpen(false)}
        title={insights ? `${insights.role_name} desk` : "Shop desk"}
        description={insights ? `দোকানের স্মার্ট ইনসাইট · ${insights.daily_tip}` : undefined}
        size="xl"
      >
        <RoleInsightsPanel insights={insights} inModal />
      </Modal>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
        {stats.map(({ key, label, icon: Icon, currency, warn }, i) => {
          const value = data?.[key] ?? 0;
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
            >
              <Card className="h-full">
                <CardBody className="p-3.5 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-[#5c6b63]">{label}</p>
                      <p
                        className={`mt-1.5 truncate text-xl font-semibold tracking-tight ${
                          warn && Number(value) > 0
                            ? "text-amber-700"
                            : "text-[#14201a]"
                        }`}
                      >
                        {currency ? formatCurrency(value) : formatNumber(value)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[#e6f4ee] p-2 text-[#0b6e4f]">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/stock", label: "Receive stock", icon: Boxes },
          { href: "/products", label: "Manage products", icon: Package },
          { href: "/purchase-orders", label: "New purchase order", icon: ShoppingCart },
          { href: "/sales-orders", label: "New sales order", icon: Truck },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between rounded-xl border border-[#d8e0d9] bg-white px-4 py-3 text-sm font-medium text-[#14201a] transition hover:border-[#0b6e4f]/40 hover:bg-[#e6f4ee]/40"
          >
            <span className="flex items-center gap-2">
              <item.icon className="h-4 w-4 text-[#0b6e4f]" />
              {item.label}
            </span>
            <ArrowRight className="h-4 w-4 text-[#5c6b63]" />
          </Link>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-5 xl:items-start">
        <div className="xl:col-span-3">
          <DashboardStockTabs
            stock={stock}
            lowStock={lowStock}
            movements={movements}
            purchaseOrders={purchaseOrders}
            salesOrders={salesOrders}
          />
        </div>

        <div className="grid gap-4 xl:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-[#14201a]">Stock by warehouse</h2>
              <p className="text-xs text-[#5c6b63]">Units on hand per location</p>
            </CardHeader>
            <CardBody>
              {warehouseChart.length === 0 ? (
                <p className="text-center text-sm text-[#5c6b63]">No stock data yet.</p>
              ) : (
                <SimpleBarChart
                  items={warehouseChart}
                  valueFormatter={(v) => formatNumber(v)}
                />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-[#14201a]">Movement activity</h2>
              <p className="text-xs text-[#5c6b63]">Last 7 days quantity moved</p>
            </CardHeader>
            <CardBody>
              <MiniSparkline values={sparkline} />
              <p className="mt-2 text-center text-[10px] uppercase tracking-wide text-[#5c6b63]">
                Older ← today →
              </p>
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-[#14201a]">Top products by quantity</h2>
            <p className="text-xs text-[#5c6b63]">Highest on-hand SKUs</p>
          </CardHeader>
          <CardBody>
            {productChart.length === 0 ? (
              <p className="text-center text-sm text-[#5c6b63]">No products in stock.</p>
            ) : (
              <SimpleBarChart
                items={productChart}
                valueFormatter={(v) => formatNumber(v)}
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-[#14201a]">Movement types</h2>
            <p className="text-xs text-[#5c6b63]">Receipt, issue, transfer breakdown</p>
          </CardHeader>
          <CardBody>
            {movementChart.length === 0 ? (
              <p className="text-center text-sm text-[#5c6b63]">No movements recorded.</p>
            ) : (
              <SimpleDonutChart items={movementChart} />
            )}
          </CardBody>
        </Card>

        <Card className="md:col-span-2 xl:col-span-1">
          <CardHeader>
            <h2 className="font-semibold text-[#14201a]">Order pipeline</h2>
            <p className="text-xs text-[#5c6b63]">Purchase & sales order status</p>
          </CardHeader>
          <CardBody>
            {orderChart.length === 0 ? (
              <p className="text-center text-sm text-[#5c6b63]">No orders yet.</p>
            ) : (
              <SimpleDonutChart items={orderChart} size={150} />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
