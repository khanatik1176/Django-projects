"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Package, ShoppingCart, Truck, TrendingUp } from "lucide-react";
import { getDashboard } from "@/lib/api/inventory";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { DashboardData } from "@/lib/types";

interface Insight {
  id: string;
  title: string;
  body: string;
  href: string;
  tone: "alert" | "info" | "success";
  icon: typeof AlertTriangle;
}

const toneStyles = {
  alert: {
    wrap: "border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50",
    icon: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
  info: {
    wrap: "border-sky-200/80 bg-gradient-to-br from-sky-50 to-[#e6f4ee]",
    icon: "bg-sky-100 text-sky-700",
    dot: "bg-sky-500",
  },
  success: {
    wrap: "border-[#b8e0d0] bg-gradient-to-br from-[#e6f4ee] to-[#f0faf5]",
    icon: "bg-[#cce8dc] text-[#085340]",
    dot: "bg-[#0b6e4f]",
  },
};

function buildInsights(data: DashboardData | null): Insight[] {
  if (!data) {
    return [
      {
        id: "loading",
        title: "Syncing inventory",
        body: "Pulling live stock and order signals…",
        href: "/dashboard",
        tone: "info",
        icon: TrendingUp,
      },
    ];
  }

  const items: Insight[] = [];

  if (data.low_stock_items > 0) {
    items.push({
      id: "low-stock",
      title: "Low stock alert",
      body: `${data.low_stock_items} SKU${data.low_stock_items > 1 ? "s" : ""} below reorder level — replenish before shelves run empty.`,
      href: "/stock",
      tone: "alert",
      icon: AlertTriangle,
    });
  }

  if (data.open_purchase_orders > 0) {
    items.push({
      id: "open-po",
      title: "Inbound pending",
      body: `${data.open_purchase_orders} purchase order${data.open_purchase_orders > 1 ? "s" : ""} waiting for stock receipt.`,
      href: "/purchase-orders",
      tone: "info",
      icon: ShoppingCart,
    });
  }

  if (data.open_sales_orders > 0) {
    items.push({
      id: "open-so",
      title: "Outbound queue",
      body: `${data.open_sales_orders} sales order${data.open_sales_orders > 1 ? "s" : ""} need confirmation or fulfillment.`,
      href: "/sales-orders",
      tone: "info",
      icon: Truck,
    });
  }

  items.push({
    id: "inventory-value",
    title: "Stock on hand",
    body: `${formatNumber(data.total_units_on_hand)} units across ${data.total_warehouses} warehouse${data.total_warehouses > 1 ? "s" : ""} · ${formatCurrency(data.total_inventory_value)} value.`,
    href: "/dashboard",
    tone: "success",
    icon: Package,
  });

  return items;
}

export function SidebarInsight() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [index, setIndex] = useState(0);

  const insights = useMemo(() => buildInsights(data), [data]);
  const active = insights[index % insights.length];
  const styles = toneStyles[active.tone];

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data))
      .catch(() => setData(null));
  }, []);

  useEffect(() => {
    setIndex(0);
  }, [insights.length]);

  useEffect(() => {
    if (insights.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % insights.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [insights.length]);

  return (
    <div className="border-t border-[#ecf1ed] p-3">
      <Link href={active.href} className="block">
        <motion.div
          layout
          className={`relative overflow-hidden rounded-2xl border p-3.5 shadow-sm ${styles.wrap}`}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
        >
          {active.tone === "alert" && (
            <motion.span
              className="absolute right-3 top-3 h-2 w-2 rounded-full bg-amber-500"
              animate={{ scale: [1, 1.45, 1], opacity: [1, 0.55, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          <div className="flex items-start gap-3">
            <motion.div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <active.icon className="h-4 w-4" strokeWidth={2} />
            </motion.div>

            <div className="min-w-0 flex-1 pr-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5c6b63]">
                Live ops
              </p>
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="mt-1 text-sm font-semibold leading-snug text-[#14201a]">
                    {active.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#5c6b63]">
                    {active.body}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {insights.length > 1 && (
            <div className="mt-3 flex items-center gap-1.5">
              {insights.map((item, i) => (
                <motion.span
                  key={item.id}
                  className={`h-1.5 rounded-full ${i === index % insights.length ? styles.dot : "bg-[#d8e0d9]"}`}
                  animate={{
                    width: i === index % insights.length ? 18 : 6,
                    opacity: i === index % insights.length ? 1 : 0.55,
                  }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>
          )}
        </motion.div>
      </Link>
    </div>
  );
}
