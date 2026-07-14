"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Clock,
  Package,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StockHealthBadge } from "@/components/inventory/StockHealthBadge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { ReorderSuggestion, ShopInsights, StockHealthStatus } from "@/lib/types";

const healthOrder = [
  "EXPIRING_SOON",
  "LOW_STOCK",
  "ADEQUATE",
  "GOOD",
  "OUT_OF_STOCK",
] as const;

const healthLinks: Partial<Record<StockHealthStatus, string>> = {
  EXPIRING_SOON: "/clearance",
  LOW_STOCK: "/stock",
  OUT_OF_STOCK: "/stock",
};

function RoleInsightsContent({ insights }: { insights: ShopInsights }) {
  const role = insights.role_code;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {healthOrder.map((key) => {
          const count = insights.health_summary[key] ?? 0;
          if (!count) return null;
          const href = healthLinks[key];
          const content = (
            <>
              <StockHealthBadge status={key} />
              <span className="text-sm font-semibold text-[#14201a]">{count}</span>
            </>
          );

          if (href) {
            return (
              <Link
                key={key}
                href={href}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#ecf1ed] bg-white px-3 py-2 transition hover:border-[#0b6e4f]/35 hover:bg-[#e6f4ee]/40"
              >
                {content}
              </Link>
            );
          }

          return (
            <div
              key={key}
              className="flex items-center gap-2 rounded-lg border border-[#ecf1ed] bg-white px-3 py-2"
            >
              {content}
            </div>
          );
        })}
      </div>

      {insights.reorder_suggestions.length > 0 && (
        <InsightSection
          title="Reorder suggestions"
          icon={ShoppingCart}
          href="/purchase-orders"
        >
          {insights.reorder_suggestions.slice(0, 4).map((item) => (
            <ReorderRow key={item.stock_id} item={item} href="/purchase-orders" />
          ))}
        </InsightSection>
      )}

      {insights.expiring_batches.length > 0 && (
        <InsightSection
          title="মেয়াদ শেষ হচ্ছে (FEFO)"
          icon={Clock}
          href="/clearance"
        >
          {insights.expiring_batches.slice(0, 4).map((b) => (
            <InsightRow
              key={b.batch_id}
              title={b.product_name}
              meta={`${b.warehouse_name} · ${b.days_left} days left`}
              href="/clearance"
              trailing={
                <Badge variant="danger">{formatNumber(b.quantity)}</Badge>
              }
            />
          ))}
        </InsightSection>
      )}

      {role === "ADMIN" && insights.admin_panel && (
        <AdminPanel data={insights.admin_panel} />
      )}

      {insights.manager_panel && role !== "VIEWER" && (
        <ManagerPanel data={insights.manager_panel} />
      )}

      {insights.warehouse_panel && (
        <WarehousePanel data={insights.warehouse_panel} />
      )}

      {insights.viewer_panel && (
        <ViewerPanel data={insights.viewer_panel} />
      )}
    </div>
  );
}

export function RoleInsightsPanel({
  insights,
  inModal = false,
}: {
  insights: ShopInsights | null;
  inModal?: boolean;
}) {
  if (!insights) return null;

  if (inModal) {
    return <RoleInsightsContent insights={insights} />;
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-[#0b6e4f]/20 bg-gradient-to-br from-[#f0faf5] to-white">
        <CardHeader className="border-b border-[#ecf1ed]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#0b6e4f]">
                {insights.role_name} desk
              </p>
              <h2 className="mt-1 font-semibold text-[#14201a]">দোকানের স্মার্ট ইনসাইট</h2>
              <p className="mt-1 text-xs text-[#5c6b63]">{insights.daily_tip}</p>
            </div>
            <div className="rounded-xl bg-[#0b6e4f] p-2.5 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <RoleInsightsContent insights={insights} />
        </CardBody>
      </Card>
    </div>
  );
}

function InsightSection({
  title,
  icon: Icon,
  href,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#ecf1ed] bg-white">
      <div className="flex items-center justify-between border-b border-[#ecf1ed] px-4 py-2.5">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#5c6b63]">
          <Icon className="h-3.5 w-3.5 text-[#0b6e4f]" />
          {title}
        </p>
        {href && (
          <Link
            href={href}
            className="cursor-pointer text-xs font-semibold text-[#0b6e4f] hover:underline"
          >
            View all →
          </Link>
        )}
      </div>
      <div className="divide-y divide-[#f4f6f3]">{children}</div>
    </div>
  );
}

function InsightRow({
  title,
  meta,
  trailing,
  href,
}: {
  title: string;
  meta: string;
  trailing?: React.ReactNode;
  href?: string;
}) {
  const content = (
    <>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[#14201a]">{title}</p>
        <p className="truncate text-xs text-[#5c6b63]">{meta}</p>
      </div>
      {trailing}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 transition hover:bg-[#f8faf8]"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      {content}
    </div>
  );
}

function ReorderRow({ item, href }: { item: ReorderSuggestion; href: string }) {
  return (
    <InsightRow
      title={item.product_name}
      meta={`${item.warehouse_name} · order ~${formatNumber(item.suggested_order_qty)} from ${item.supplier_name}`}
      href={href}
      trailing={<StockHealthBadge status={item.health_status} label={item.health_label} />}
    />
  );
}

function DeadStockSection({ items }: { items: ReorderSuggestion[] }) {
  if (items.length === 0) return null;
  return (
    <InsightSection title="Dead stock" icon={AlertTriangle} href="/clearance">
      {items.slice(0, 3).map((item) => (
        <InsightRow
          key={item.stock_id}
          title={item.product_name}
          meta={`${item.warehouse_name} · ${formatNumber(item.quantity)} on hand`}
          href="/clearance"
          trailing={<StockHealthBadge status={item.health_status} label={item.health_label} />}
        />
      ))}
    </InsightSection>
  );
}

function AdminPanel({
  data,
}: {
  data: NonNullable<ShopInsights["admin_panel"]>;
}) {
  const margin = data.margin_snapshot;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <p className="mb-2 text-sm font-semibold text-[#14201a]">{data.headline}</p>
      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        <MiniStat
          icon={Users}
          label="Pending staff"
          value={String(data.pending_approvals)}
          warn={data.pending_approvals > 0}
          href={data.pending_approvals > 0 ? "/configuration" : undefined}
        />
        <MiniStat
          icon={TrendingUp}
          label="Margin potential"
          value={`${margin.margin_percent}%`}
        />
        <MiniStat
          icon={AlertTriangle}
          label="Expiry risk"
          value={formatCurrency(data.expiring_loss_risk)}
          warn
          href="/clearance"
        />
      </div>
      {data.pending_approvals > 0 && (
        <Link
          href="/configuration"
          className="mb-3 inline-flex cursor-pointer text-xs font-semibold text-[#0b6e4f] hover:underline"
        >
          Approve new shop staff →
        </Link>
      )}
      <DeadStockSection items={data.dead_stock} />
    </motion.div>
  );
}

function ManagerPanel({
  data,
}: {
  data: NonNullable<ShopInsights["manager_panel"]>;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[#14201a]">{data.headline}</p>
      <div className="grid gap-3 md:grid-cols-2">
        <InsightSection title="Restock — open POs" icon={ShoppingCart} href="/purchase-orders">
          {data.open_purchase_orders.length === 0 ? (
            <p className="px-4 py-3 text-xs text-[#5c6b63]">No open purchase orders.</p>
          ) : (
            data.open_purchase_orders.slice(0, 3).map((po) => (
              <InsightRow
                key={po.id}
                title={po.po_number}
                meta={po.supplier_name}
                href="/purchase-orders"
                trailing={<Badge variant="info">{po.status.replace(/_/g, " ")}</Badge>}
              />
            ))
          )}
        </InsightSection>
        <InsightSection title="Sell — open orders" icon={Truck} href="/sales-orders">
          {data.open_sales_orders.length === 0 ? (
            <p className="px-4 py-3 text-xs text-[#5c6b63]">No open sales orders.</p>
          ) : (
            data.open_sales_orders.slice(0, 3).map((so) => (
              <InsightRow
                key={so.id}
                title={so.so_number}
                meta={so.customer_name}
                href="/sales-orders"
                trailing={<Badge variant="info">{so.status.replace(/_/g, " ")}</Badge>}
              />
            ))
          )}
        </InsightSection>
      </div>
      <DeadStockSection items={data.dead_stock} />
    </div>
  );
}

function WarehousePanel({
  data,
}: {
  data: NonNullable<ShopInsights["warehouse_panel"]>;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[#14201a]">{data.headline}</p>
      <div className="grid gap-3 md:grid-cols-2">
        <InsightSection title="Receive queue" icon={Package} href="/purchase-orders">
          {data.receive_queue.slice(0, 3).map((po) => (
            <InsightRow
              key={po.id}
              title={po.po_number}
              meta={po.supplier_name}
              href="/purchase-orders"
            />
          ))}
        </InsightSection>
        <InsightSection title="Pick list" icon={Truck} href="/sales-orders">
          {data.pick_list.slice(0, 3).map((so) => (
            <InsightRow
              key={so.id}
              title={so.so_number}
              meta={so.customer_name}
              href="/sales-orders"
            />
          ))}
        </InsightSection>
      </div>
      {data.shelf_refill.length > 0 && (
        <InsightSection title="Shelf refill needed" icon={AlertTriangle} href="/purchase-orders">
          {data.shelf_refill.map((item) => (
            <ReorderRow key={item.stock_id} item={item} href="/purchase-orders" />
          ))}
        </InsightSection>
      )}
      {data.fefo_alerts.length > 0 && (
        <InsightSection title="FEFO alerts" icon={Clock} href="/clearance">
          {data.fefo_alerts.slice(0, 3).map((b) => (
            <InsightRow
              key={b.batch_id}
              title={b.product_name}
              meta={`${b.warehouse_name} · ${b.days_left} days left`}
              href="/clearance"
              trailing={<Badge variant="danger">{formatNumber(b.quantity)}</Badge>}
            />
          ))}
        </InsightSection>
      )}
    </div>
  );
}

function ViewerPanel({
  data,
}: {
  data: NonNullable<ShopInsights["viewer_panel"]>;
}) {
  return (
    <InsightSection title={data.headline} icon={Package} href="/stock">
      <p className="px-4 py-2 text-xs text-[#5c6b63]">
        {data.movement_today} stock movements today
      </p>
      {data.price_board.map((item) => (
        <InsightRow
          key={item.sku}
          title={item.product_name}
          meta={`${item.sku} · ${formatNumber(item.quantity)} ${item.unit}`}
          href="/stock"
          trailing={
            <span className="text-sm font-semibold text-[#0b6e4f]">
              {formatCurrency(item.selling_price)}
            </span>
          }
        />
      ))}
    </InsightSection>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  warn,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  warn?: boolean;
  href?: string;
}) {
  const inner = (
    <>
      <div className="flex items-center gap-2 text-[#5c6b63]">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className={`mt-1 text-lg font-semibold ${warn ? "text-amber-700" : "text-[#14201a]"}`}>
        {value}
      </p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block cursor-pointer rounded-lg border border-[#ecf1ed] bg-white p-3 transition hover:border-[#0b6e4f]/30 hover:bg-[#f8faf8]"
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className="rounded-lg border border-[#ecf1ed] bg-white p-3">
      {inner}
    </div>
  );
}
