"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { StockHealthBadge } from "@/components/inventory/StockHealthBadge";
import { StockQuantityCell } from "@/components/inventory/StockQuantityCell";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import type { PurchaseOrder, SalesOrder, Stock, StockMovement } from "@/lib/types";

type TabId = "stock" | "low-stock" | "movements" | "orders";

const PAGE_SIZE = 10;

const tabs: { id: TabId; label: string }[] = [
  { id: "stock", label: "Stock levels" },
  { id: "low-stock", label: "Low stock" },
  { id: "movements", label: "Movements" },
  { id: "orders", label: "Orders" },
];

function paginate<T>(items: T[], page: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  return {
    items: items.slice(start, start + PAGE_SIZE),
    totalPages,
    currentPage: safePage,
    totalCount: items.length,
  };
}

export function DashboardStockTabs({
  stock,
  lowStock,
  movements,
  purchaseOrders,
  salesOrders,
}: {
  stock: Stock[];
  lowStock: Stock[];
  movements: StockMovement[];
  purchaseOrders: PurchaseOrder[];
  salesOrders: SalesOrder[];
}) {
  const [active, setActive] = useState<TabId>("stock");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [active]);

  const poItems = useMemo(
    () =>
      purchaseOrders.map((po) => ({
        id: po.id,
        number: po.po_number,
        meta: `${po.supplier_name} · ${formatCurrency(po.total_cost)}`,
        status: po.status,
      })),
    [purchaseOrders],
  );

  const soItems = useMemo(
    () =>
      salesOrders.map((so) => ({
        id: so.id,
        number: so.so_number,
        meta: `${so.customer_name} · ${formatCurrency(so.total_revenue)}`,
        status: so.status,
      })),
    [salesOrders],
  );

  const stockPage = useMemo(() => paginate(stock, page), [stock, page]);
  const lowStockPage = useMemo(() => paginate(lowStock, page), [lowStock, page]);
  const movementsPage = useMemo(() => paginate(movements, page), [movements, page]);
  const poPage = useMemo(() => paginate(poItems, page), [poItems, page]);
  const soPage = useMemo(() => paginate(soItems, page), [soItems, page]);

  const ordersTotalCount = poItems.length + soItems.length;
  const ordersTotalPages = Math.max(
    poPage.totalPages,
    soPage.totalPages,
    ordersTotalCount > 0 ? 1 : 1,
  );

  const paginationProps = {
    stock: stockPage,
    "low-stock": lowStockPage,
    movements: movementsPage,
    orders: {
      currentPage: page,
      totalPages: ordersTotalPages,
      totalCount: ordersTotalCount,
    },
  }[active];

  return (
    <Card>
      <CardHeader className="space-y-3 border-b border-[#ecf1ed] pb-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-[#14201a]">Inventory details</h2>
            <p className="text-xs text-[#5c6b63]">Stock, alerts, activity & orders</p>
          </div>
          <Link href="/stock" className="text-xs font-semibold text-[#0b6e4f]">
            Open stock
          </Link>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                active === tab.id
                  ? "bg-[#0b6e4f] text-white"
                  : "bg-[#ecf1ed] text-[#5c6b63] hover:bg-[#e6f4ee] hover:text-[#14201a]",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardBody className="p-0">
        {active === "stock" && (
          <StockTable rows={stockPage.items} empty="No stock records yet." />
        )}

        {active === "low-stock" && (
          <StockTable rows={lowStockPage.items} empty="No low-stock items right now." />
        )}

        {active === "movements" && (
          <div>
            {movementsPage.totalCount === 0 ? (
              <Empty message="No movements yet." />
            ) : (
              <div className="divide-y divide-[#ecf1ed]">
                {movementsPage.items.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#f8faf8]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#14201a]">
                        {m.product_name}
                      </p>
                      <p className="truncate text-xs text-[#5c6b63]">
                        {m.warehouse_name} · {formatDate(m.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={statusVariant(m.movement_type)}>
                        {m.movement_type.replace(/_/g, " ")}
                      </Badge>
                      <p className="mt-1 text-xs font-medium">{formatNumber(m.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {active === "orders" && (
          <div className="grid divide-y divide-[#ecf1ed] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
            <OrderList
              title="Purchase orders"
              href="/purchase-orders"
              empty="No purchase orders."
              items={poPage.items}
            />
            <OrderList
              title="Sales orders"
              href="/sales-orders"
              empty="No sales orders."
              items={soPage.items}
            />
          </div>
        )}

        <Pagination
          currentPage={paginationProps.currentPage}
          totalPages={paginationProps.totalPages}
          totalCount={paginationProps.totalCount}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          showPageSize={false}
        />
      </CardBody>
    </Card>
  );
}

function Empty({ message }: { message: string }) {
  return <p className="px-4 py-10 text-center text-sm text-[#5c6b63]">{message}</p>;
}

function StockTable({
  rows,
  empty,
}: {
  rows: Stock[];
  empty: string;
  lowStock?: boolean;
}) {
  if (rows.length === 0) return <Empty message={empty} />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-[#ecf1ed] text-left text-xs text-[#5c6b63]">
            <th className="px-4 py-2.5 font-medium">Product</th>
            <th className="px-4 py-2.5 font-medium">Warehouse</th>
            <th className="px-4 py-2.5 font-medium">Stock quantity</th>
            <th className="px-4 py-2.5 font-medium">Reorder</th>
            <th className="px-4 py-2.5 font-medium">Shelf health</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} className="border-b border-[#f4f6f3] hover:bg-[#f8faf8]">
              <td className="px-4 py-2.5">
                <p className="font-medium text-[#14201a]">{s.product_name}</p>
                <p className="text-xs text-[#5c6b63]">{s.product_sku}</p>
              </td>
              <td className="px-4 py-2.5 text-[#5c6b63]">{s.warehouse_name}</td>
              <td className="px-4 py-2.5">
                <StockQuantityCell stock={s} />
              </td>
              <td className="px-4 py-2.5 font-medium">{formatNumber(s.reorder_level)}</td>
              <td className="px-4 py-2.5">
                <StockHealthBadge
                  status={s.health_status}
                  label={s.health_label}
                  daysToExpiry={s.days_to_expiry}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrderList({
  title,
  href,
  empty,
  items,
}: {
  title: string;
  href: string;
  empty: string;
  items: { id: number; number: string; meta: string; status: string }[];
}) {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-[#ecf1ed] px-4 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#5c6b63]">
          {title}
        </p>
        <Link href={href} className="text-xs font-semibold text-[#0b6e4f]">
          View
        </Link>
      </div>
      {items.length === 0 ? (
        <Empty message={empty} />
      ) : (
        <div className="divide-y divide-[#ecf1ed]">
          {items.map((item) => (
            <div key={item.id} className="px-4 py-3 hover:bg-[#f8faf8]">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{item.number}</p>
                <Badge variant={statusVariant(item.status)}>
                  {item.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-[#5c6b63]">{item.meta}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
