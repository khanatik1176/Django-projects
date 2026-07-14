"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import {
  createExpense,
  deleteExpense,
  getExpenses,
  getFinanceSummary,
  getPayments,
} from "@/lib/api/finance";
import { PageHeader, LoadingState, EmptyState, Alert } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { SimpleBarChart } from "@/components/dashboard/SimpleCharts";
import { useServerPagination } from "@/hooks/useServerPagination";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import type { FinanceExpense, FinancePayment, FinanceSummary } from "@/lib/types";
import { getErrorMessage } from "@/lib/api/client";

type Tab = "overview" | "payments" | "expenses";

interface ExpenseForm {
  category: string;
  amount: string;
  description: string;
  expense_date: string;
  payment_method: string;
  notes?: string;
}

const EXPENSE_CATEGORIES = [
  { value: "RENT", label: "Shop rent" },
  { value: "UTILITIES", label: "Utilities" },
  { value: "SALARY", label: "Salary / wages" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "SUPPLIES", label: "Shop supplies" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "OTHER", label: "Other" },
];

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "BKASH", label: "bKash" },
  { value: "NAGAD", label: "Nagad" },
  { value: "BANK", label: "Bank" },
];

const PAYMENT_TYPES = [
  { value: "", label: "All types" },
  { value: "SALE_INCOME", label: "Sale income" },
  { value: "CREDIT_SALE", label: "Credit sale (udhar)" },
  { value: "CREDIT_COLLECTION", label: "Udhar collection" },
  { value: "PURCHASE_PAYMENT", label: "Supplier payment" },
  { value: "EXPENSE", label: "Expense" },
  { value: "ADJUSTMENT", label: "Adjustment" },
];

const PAYMENT_METHOD_FILTER = [
  { value: "", label: "All methods" },
  ...PAYMENT_METHODS,
];

export default function FinancePage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [payments, setPayments] = useState<FinancePayment[]>([]);
  const [expenses, setExpenses] = useState<FinanceExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
  const { page, setPage, pageSize, onPageSizeChange, pagination, applyResponse } =
    useServerPagination(10);

  const { register, handleSubmit, reset } = useForm<ExpenseForm>({
    defaultValues: {
      expense_date: new Date().toISOString().split("T")[0],
      payment_method: "CASH",
      category: "OTHER",
    },
  });

  const loadSummary = useCallback(async () => {
    const res = await getFinanceSummary();
    setSummary(res.data);
  }, []);

  const loadPayments = useCallback(async () => {
    const params: Record<string, string> = {
      page: String(page),
      page_size: String(pageSize),
      ordering: "-created_at",
    };
    if (paymentTypeFilter) params.payment_type = paymentTypeFilter;
    if (paymentMethodFilter) params.payment_method = paymentMethodFilter;

    const res = await getPayments(params);
    setPayments(res.data.results);
    applyResponse(res.data);
  }, [page, pageSize, paymentTypeFilter, paymentMethodFilter, applyResponse]);

  const loadExpenses = useCallback(async () => {
    const res = await getExpenses({
      page: String(page),
      page_size: String(pageSize),
      ordering: "-expense_date",
    });
    setExpenses(res.data.results);
    applyResponse(res.data);
  }, [page, pageSize, applyResponse]);

  useEffect(() => {
    setLoading(true);
    setError("");
    const load = async () => {
      try {
        if (tab === "overview") {
          await loadSummary();
        } else if (tab === "payments") {
          await loadPayments();
        } else {
          await loadExpenses();
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tab, loadSummary, loadPayments, loadExpenses]);

  const onCreateExpense = async (data: ExpenseForm) => {
    setSubmitting(true);
    try {
      await createExpense(data);
      setShowExpenseForm(false);
      reset({
        expense_date: new Date().toISOString().split("T")[0],
        payment_method: "CASH",
        category: "OTHER",
      });
      setTab("expenses");
      await loadSummary();
      await loadExpenses();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onDeleteExpense = async (id: number) => {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await deleteExpense(id);
      loadExpenses();
      loadSummary();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const hasUdharOutstanding = Number(summary?.udhar_outstanding ?? 0) > 0;
  const hasMethodBreakdown = (summary?.payment_method_breakdown.length ?? 0) > 0;

  const revenueChart =
    summary?.daily_revenue.map((d, i) => ({
      id: d.date,
      label: formatDate(d.date).slice(0, 6),
      value: Number(d.revenue),
      color: ["#0b6e4f", "#1a9d6c", "#5ee0b0", "#f59e0b", "#0ea5e9", "#8b5cf6", "#0b6e4f"][i % 7],
    })) ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Finance & Cash Book"
        description="Revenue, expenses, udhar outstanding & payment logs"
        action={
          <Button onClick={() => setShowExpenseForm(true)}>
            <Plus className="h-4 w-4" />
            Record expense
          </Button>
        }
      />

      {error && <Alert message={error} />}

      <div className="flex flex-wrap gap-2">
        {(["overview", "payments", "expenses"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setPage(1);
              setTab(t);
            }}
            className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "bg-[#0b6e4f] text-white"
                : "bg-white text-[#5c6b63] ring-1 ring-[#d8e0d9] hover:bg-[#f4f6f3]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <Modal open={showExpenseForm} onClose={() => setShowExpenseForm(false)} title="Record expense">
        <form onSubmit={handleSubmit(onCreateExpense)} className="space-y-4">
          <Select label="Category" options={EXPENSE_CATEGORIES} {...register("category", { required: true })} />
          <Input label="Amount (BDT)" type="number" step="0.01" {...register("amount", { required: true })} />
          <Input label="Description" {...register("description", { required: true })} />
          <Input label="Date" type="date" {...register("expense_date", { required: true })} />
          <Select label="Paid via" options={PAYMENT_METHODS} {...register("payment_method")} />
          <Input label="Notes" {...register("notes")} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowExpenseForm(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Save</Button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <LoadingState />
      ) : tab === "overview" && summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardBody>
                <p className="flex items-center gap-2 text-xs text-[#5c6b63]">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  Today&apos;s revenue
                </p>
                <p className="mt-1 text-2xl font-bold text-[#14201a]">{formatCurrency(summary.today_revenue)}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-xs text-[#5c6b63]">This month revenue</p>
                <p className="mt-1 text-2xl font-bold text-[#14201a]">{formatCurrency(summary.month_revenue)}</p>
              </CardBody>
            </Card>
            <Card className="border-rose-200 bg-rose-50/40">
              <CardBody>
                <p className="flex items-center gap-2 text-xs text-[#5c6b63]">
                  <TrendingDown className="h-4 w-4 text-rose-600" />
                  Month expenses
                </p>
                <p className="mt-1 text-2xl font-bold text-[#14201a]">{formatCurrency(summary.month_expenses)}</p>
              </CardBody>
            </Card>
            <Card
              className={
                hasUdharOutstanding
                  ? "border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100/60 ring-2 ring-amber-200/80 sm:col-span-2 lg:col-span-1"
                  : ""
              }
            >
              <CardBody>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-800">
                  <Wallet className="h-4 w-4 text-amber-600" />
                  Udhar outstanding
                </p>
                <p
                  className={`mt-1 font-bold text-amber-900 ${
                    hasUdharOutstanding ? "text-3xl" : "text-2xl"
                  }`}
                >
                  {formatCurrency(summary.udhar_outstanding)}
                </p>
                {hasUdharOutstanding && (
                  <p className="mt-2 text-xs text-amber-800/80">
                    Neighborhood credit still to collect — review Hal Khata.
                  </p>
                )}
              </CardBody>
            </Card>
          </div>

          {hasMethodBreakdown && (
            <Card className="border-[#0b6e4f]/25 bg-gradient-to-br from-[#f0faf5] to-white">
              <CardHeader>
                <h2 className="font-semibold text-[#14201a]">Payment method breakdown</h2>
                <p className="text-xs text-[#5c6b63]">This month by channel</p>
              </CardHeader>
              <CardBody>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {summary.payment_method_breakdown.map((row) => (
                    <div
                      key={row.payment_method}
                      className="rounded-xl border border-[#d8e0d9] bg-white px-4 py-3"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#5c6b63]">
                        {row.payment_method}
                      </p>
                      <p className="mt-1 text-xl font-bold text-[#0b6e4f]">
                        {formatCurrency(row.total)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <h2 className="font-semibold">7-day revenue</h2>
              </CardHeader>
              <CardBody>
                {revenueChart.length === 0 ? (
                  <p className="text-sm text-[#5c6b63]">No payments recorded yet.</p>
                ) : (
                  <SimpleBarChart items={revenueChart} valueFormatter={(v) => formatCurrency(v)} />
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="font-semibold">Month net · {formatCurrency(summary.month_net)}</h2>
                <p className="text-xs text-[#5c6b63]">Revenue minus expenses this month</p>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-[#5c6b63]">
                  {formatCurrency(summary.month_revenue)} revenue − {formatCurrency(summary.month_expenses)} expenses
                </p>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <h2 className="font-semibold">Recent transactions</h2>
            </CardHeader>
            <CardBody className="divide-y divide-[#ecf1ed] p-0">
              {summary.recent_payments.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-[#5c6b63]">No transactions yet. Use POS or record expenses.</p>
              ) : (
                summary.recent_payments.map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium">{p.description}</p>
                      <p className="text-xs text-[#5c6b63]">{formatDateTime(p.created_at)} · {p.payment_method}</p>
                    </div>
                    <Badge variant={p.direction === "IN" ? "success" : "warning"}>
                      {p.direction === "IN" ? "+" : "-"}{formatCurrency(p.amount)}
                    </Badge>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </>
      ) : tab === "payments" ? (
        <>
          <Card>
            <CardBody>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Select
                  label="Payment type"
                  options={PAYMENT_TYPES}
                  value={paymentTypeFilter}
                  onChange={(e) => {
                    setPaymentTypeFilter(e.target.value);
                    setPage(1);
                  }}
                />
                <Select
                  label="Payment method"
                  options={PAYMENT_METHOD_FILTER}
                  value={paymentMethodFilter}
                  onChange={(e) => {
                    setPaymentMethodFilter(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </CardBody>
          </Card>
          <Card>
          <CardBody className="p-0">
            {payments.length === 0 ? (
              <EmptyState title="No payments" description="POS sales and udhar collections appear here." />
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#ecf1ed] text-left text-[#5c6b63]">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b border-[#f4f6f3]">
                        <td className="px-4 py-3">{formatDateTime(p.created_at)}</td>
                        <td className="px-4 py-3">{p.payment_type.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3">{p.payment_method}</td>
                        <td className="px-4 py-3">{p.description}</td>
                        <td className={`px-4 py-3 font-medium ${p.direction === "IN" ? "text-emerald-700" : "text-rose-700"}`}>
                          {p.direction === "IN" ? "+" : "-"}{formatCurrency(p.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
        </>
      ) : (
        <Card>
          <CardBody className="p-0">
            {expenses.length === 0 ? (
              <EmptyState title="No expenses" description="Record shop rent, utilities, and other costs." />
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#ecf1ed] text-left text-[#5c6b63]">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((e) => (
                      <tr key={e.id} className="border-b border-[#f4f6f3]">
                        <td className="px-4 py-3">{formatDate(e.expense_date)}</td>
                        <td className="px-4 py-3">{e.category}</td>
                        <td className="px-4 py-3">{e.description}</td>
                        <td className="px-4 py-3">{e.payment_method}</td>
                        <td className="px-4 py-3 font-medium text-rose-700">-{formatCurrency(e.amount)}</td>
                        <td className="px-4 py-3">
                          <Button size="sm" variant="ghost" onClick={() => onDeleteExpense(e.id)}>Delete</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
      )}
    </div>
  );
}
