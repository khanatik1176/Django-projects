"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Printer, Search } from "lucide-react";
import { getPosInvoices } from "@/lib/api/orders";
import { PageHeader, LoadingState, EmptyState, Alert } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import type { SalesOrder } from "@/lib/types";
import { getErrorMessage } from "@/lib/api/client";

const paymentLabel: Record<string, string> = {
  CASH: "নগদ Cash",
  BKASH: "bKash",
  NAGAD: "Nagad",
  CREDIT: "উধার Udhar",
};

export default function InvoiceBankPage() {
  const [invoices, setInvoices] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pagination, setPagination] = useState({
    count: 0,
    total_pages: 1,
    current_page: 1,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {
        page: String(page),
        page_size: String(pageSize),
        ordering: "-created_at",
      };
      if (search.trim()) params.search = search.trim();
      const res = await getPosInvoices(params);
      setInvoices(res.data.results);
      setPagination({
        count: res.data.count,
        total_pages: res.data.total_pages,
        current_page: res.data.current_page,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Invoice Bank"
        description="All Counter POS sales invoices — view, print, and look up past bills"
        action={
          <Link href="/pos">
            <Button>
              New counter sale
            </Button>
          </Link>
        }
      />

      {error && <Alert message={error} />}

      <Card>
        <CardHeader>
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              void load();
            }}
          >
            <div className="flex-1">
              <Input
                label="Search invoices"
                placeholder="Invoice no., customer, phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </form>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="p-6">
              <LoadingState />
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No invoices yet"
                description="Complete a Counter POS sale to store the first invoice here."
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#ecf1ed] bg-[#f7f9f7] text-left text-[#5c6b63]">
                      <th className="px-4 py-3 font-medium">Invoice</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium">Warehouse</th>
                      <th className="px-4 py-3 font-medium">Payment</th>
                      <th className="px-4 py-3 font-medium">Items</th>
                      <th className="px-4 py-3 font-medium">Total</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr
                        key={inv.id}
                        className="border-b border-[#ecf1ed] transition hover:bg-[#f7f9f7]"
                      >
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-[#0b6e4f]">
                          {inv.invoice_number || inv.so_number}
                        </td>
                        <td className="px-4 py-3 text-[#5c6b63]">
                          {inv.created_at
                            ? formatDateTime(inv.created_at)
                            : formatDate(inv.order_date)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#14201a]">{inv.customer_name}</p>
                          {inv.customer_phone ? (
                            <p className="text-xs text-[#5c6b63]">{inv.customer_phone}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-[#5c6b63]">{inv.warehouse_name}</td>
                        <td className="px-4 py-3">
                          <Badge>
                            {paymentLabel[inv.payment_method || ""] ||
                              inv.payment_method ||
                              "—"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-[#5c6b63]">
                          {inv.items?.length ?? 0}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#14201a]">
                          {formatCurrency(inv.total_revenue)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Link href={`/invoices/${inv.id}`}>
                              <Button size="sm" variant="secondary">
                                <FileText className="h-3.5 w-3.5" />
                                View
                              </Button>
                            </Link>
                            <Link href={`/invoices/${inv.id}?print=1`} target="_blank">
                              <Button size="sm" variant="ghost">
                                <Printer className="h-3.5 w-3.5" />
                                Print
                              </Button>
                            </Link>
                          </div>
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
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
