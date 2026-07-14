"use client";

import { formatCurrency, formatDate, formatDateTime, formatNumber } from "@/lib/utils";
import type { SalesOrder } from "@/lib/types";

const paymentLabel: Record<string, string> = {
  CASH: "নগদ Cash",
  BKASH: "bKash",
  NAGAD: "Nagad",
  CREDIT: "উধার Udhar",
};

export function InvoiceDocument({
  invoice,
  compact = false,
}: {
  invoice: SalesOrder;
  compact?: boolean;
}) {
  const number = invoice.invoice_number || invoice.so_number;
  const method =
    paymentLabel[invoice.payment_method || ""] || invoice.payment_method || "—";

  return (
    <div
      data-invoice-print
      className={`mx-auto overflow-hidden rounded-2xl border border-[#d8e0d9] bg-white text-[#14201a] shadow-sm print:max-w-none print:rounded-none print:border-0 print:shadow-none ${
        compact ? "max-w-lg" : "max-w-3xl"
      }`}
    >
      <div className="border-b border-[#ecf1ed] bg-[#f0faf5] px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0b6e4f] text-sm font-bold text-white">
                ভ
              </span>
              <div>
                <p className="font-display text-xl leading-none">Bhandar</p>
                <p className="mt-0.5 text-[11px] text-[#5c6b63]">Inventory OS · Counter invoice</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0b6e4f]">
              Invoice
            </p>
            <p className="mt-1 font-mono text-lg font-semibold">{number}</p>
            <p className="mt-1 text-xs text-[#5c6b63]">
              {invoice.created_at
                ? formatDateTime(invoice.created_at)
                : formatDate(invoice.order_date)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 border-b border-[#ecf1ed] px-6 py-5 sm:grid-cols-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5c6b63]">
            Bill to
          </p>
          <p className="mt-1 font-semibold">{invoice.customer_name}</p>
          {invoice.customer_phone ? (
            <p className="text-sm text-[#5c6b63]">{invoice.customer_phone}</p>
          ) : null}
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5c6b63]">
            Warehouse
          </p>
          <p className="mt-1 font-semibold">{invoice.warehouse_name}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5c6b63]">
            Payment
          </p>
          <p className="mt-1 font-semibold">{method}</p>
          <p className="text-sm text-[#5c6b63]">{invoice.status}</p>
        </div>
      </div>

      <div className="overflow-x-auto px-2 py-2 sm:px-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#ecf1ed] text-left text-[#5c6b63]">
              <th className="px-2 py-3 font-medium sm:px-3">Item</th>
              <th className="px-2 py-3 font-medium sm:px-3">Qty</th>
              <th className="px-2 py-3 font-medium sm:px-3">Rate</th>
              <th className="px-2 py-3 text-right font-medium sm:px-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => {
              const qty = Number(item.quantity_ordered);
              const rate = Number(item.unit_price);
              const line =
                item.line_total != null ? Number(item.line_total) : qty * rate;
              return (
                <tr key={item.id} className="border-b border-[#f0f3f1]">
                  <td className="px-2 py-3 sm:px-3">
                    <p className="font-medium">{item.product_name}</p>
                    <p className="font-mono text-xs text-[#5c6b63]">{item.product_sku}</p>
                  </td>
                  <td className="px-2 py-3 sm:px-3">{formatNumber(qty)}</td>
                  <td className="px-2 py-3 sm:px-3">{formatCurrency(rate)}</td>
                  <td className="px-2 py-3 text-right font-medium sm:px-3">
                    {formatCurrency(line)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end border-t border-[#ecf1ed] px-6 py-5">
        <div className="min-w-[200px] space-y-2 text-sm">
          <div className="flex justify-between gap-8 text-[#5c6b63]">
            <span>Items</span>
            <span>{invoice.items.length}</span>
          </div>
          <div className="flex justify-between gap-8 border-t border-[#ecf1ed] pt-2 text-base font-semibold">
            <span>Total (BDT)</span>
            <span className="text-[#0b6e4f]">{formatCurrency(invoice.total_revenue)}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-[#ecf1ed] px-6 py-4 text-center text-xs text-[#5c6b63]">
        Thank you for shopping with Bhandar · Asia/Dhaka
      </div>
    </div>
  );
}

/** Build a SalesOrder-shaped invoice from POS checkout response for instant preview. */
export function invoiceFromPosCheckout(data: {
  id: number;
  so_number: string;
  invoice_number?: string;
  total: string;
  payment_method: string;
  status: string;
  customer_name: string;
  customer_phone?: string;
  warehouse_name: string;
  order_date?: string | null;
  created_at?: string | null;
  items: {
    product_name: string;
    product_sku: string;
    quantity: string;
    unit_price: string;
    line_total: string;
  }[];
}): SalesOrder {
  return {
    id: data.id,
    so_number: data.so_number,
    invoice_number: data.invoice_number || data.so_number,
    customer_name: data.customer_name,
    customer_phone: data.customer_phone || "",
    warehouse: 0,
    warehouse_name: data.warehouse_name,
    status: data.status,
    order_date: data.order_date || new Date().toISOString().slice(0, 10),
    notes: `POS · ${data.payment_method}`,
    payment_method: data.payment_method,
    is_pos: true,
    created_at: data.created_at || undefined,
    total_revenue: data.total,
    items: data.items.map((item, index) => ({
      id: index + 1,
      product: 0,
      product_name: item.product_name,
      product_sku: item.product_sku,
      quantity_ordered: item.quantity,
      quantity_fulfilled: item.quantity,
      quantity_remaining: "0",
      unit_price: item.unit_price,
      line_total: item.line_total,
    })),
  };
}
