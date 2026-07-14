"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { History, Pencil, Plus, Wallet } from "lucide-react";
import {
  collectPayment,
  createCustomer,
  getCustomerTransactions,
  getCustomers,
  updateCustomer,
  type CreditTransaction,
  type Customer,
} from "@/lib/api/customers";
import { PageHeader, LoadingState, EmptyState, Alert } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { useServerPagination } from "@/hooks/useServerPagination";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api/client";

interface CustomerForm {
  name: string;
  phone?: string;
  address?: string;
  credit_limit: string;
}

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "BKASH", label: "bKash" },
  { value: "NAGAD", label: "Nagad" },
  { value: "BANK", label: "Bank transfer" },
] as const;

type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];

function txnTypeVariant(type: string) {
  if (type === "PAYMENT") return "success" as const;
  if (type === "SALE") return "warning" as const;
  return "default" as const;
}

export default function UdharPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [payModal, setPayModal] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("CASH");
  const [ledgerCustomer, setLedgerCustomer] = useState<Customer | null>(null);
  const [ledgerTxns, setLedgerTxns] = useState<CreditTransaction[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [editLimitModal, setEditLimitModal] = useState<Customer | null>(null);
  const [editLimitValue, setEditLimitValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { page, setPage, pageSize, onPageSizeChange, pagination, applyResponse } =
    useServerPagination(10);

  const { register, handleSubmit, reset } = useForm<CustomerForm>({
    defaultValues: { credit_limit: "5000" },
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCustomers({
        page: String(page),
        page_size: String(pageSize),
        ordering: "-credit_balance",
      });
      setCustomers(res.data.results);
      applyResponse(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, applyResponse]);

  useEffect(() => {
    load();
  }, [load]);

  const openLedger = async (customer: Customer) => {
    setLedgerCustomer(customer);
    setLedgerTxns([]);
    setLedgerLoading(true);
    try {
      const res = await getCustomerTransactions(customer.id);
      setLedgerTxns(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
      setLedgerCustomer(null);
    } finally {
      setLedgerLoading(false);
    }
  };

  const onCreate = async (data: CustomerForm) => {
    setSubmitting(true);
    try {
      await createCustomer({ ...data, is_active: true });
      setShowForm(false);
      reset();
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onCollect = async () => {
    if (!payModal || !payAmount) return;
    setSubmitting(true);
    try {
      await collectPayment(payModal.id, payAmount, "Counter collection", payMethod);
      setSuccess(`Received ${formatCurrency(payAmount)} from ${payModal.name}`);
      setPayModal(null);
      setPayAmount("");
      setPayMethod("CASH");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onUpdateLimit = async () => {
    if (!editLimitModal || !editLimitValue) return;
    setSubmitting(true);
    try {
      await updateCustomer(editLimitModal.id, { credit_limit: editLimitValue });
      setSuccess(`Credit limit updated for ${editLimitModal.name}`);
      setEditLimitModal(null);
      setEditLimitValue("");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const totalDue = customers.reduce((s, c) => s + Number(c.credit_balance), 0);

  return (
    <div>
      <PageHeader
        title="Hal Khata"
        description="Neighborhood credit ledger — track who owes the shop"
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        }
      />

      {error && <div className="mb-4"><Alert message={error} /></div>}
      {success && <div className="mb-4"><Alert type="success" message={success} /></div>}

      <Card className="mb-4 border-[#0b6e4f]/20 bg-[#f0faf5]">
        <CardBody className="flex items-center gap-3">
          <Wallet className="h-8 w-8 text-[#0b6e4f]" />
          <div>
            <p className="text-xs text-[#5c6b63]">Total udhar outstanding (this page)</p>
            <p className="text-2xl font-bold text-[#14201a]">{formatCurrency(totalDue)}</p>
          </div>
        </CardBody>
      </Card>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New customer">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
          <Input label="Name" {...register("name", { required: true })} />
          <Input label="Phone" {...register("phone")} />
          <Input label="Address" {...register("address")} />
          <Input label="Credit limit (BDT)" type="number" {...register("credit_limit")} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Save</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!payModal}
        onClose={() => {
          setPayModal(null);
          setPayMethod("CASH");
        }}
        title={`Collect payment — ${payModal?.name}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-[#5c6b63]">
            Outstanding: <strong>{formatCurrency(payModal?.credit_balance ?? 0)}</strong>
          </p>
          <Input
            label="Amount received"
            type="number"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
          />
          <Select
            label="Payment method"
            options={PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label }))}
            value={payMethod}
            onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setPayModal(null);
                setPayMethod("CASH");
              }}
            >
              Cancel
            </Button>
            <Button loading={submitting} onClick={onCollect}>Record payment</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!editLimitModal}
        onClose={() => setEditLimitModal(null)}
        title={`Edit credit limit — ${editLimitModal?.name}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-[#5c6b63]">
            Current limit: <strong>{formatCurrency(editLimitModal?.credit_limit ?? 0)}</strong>
          </p>
          <Input
            label="New credit limit (BDT)"
            type="number"
            value={editLimitValue}
            onChange={(e) => setEditLimitValue(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditLimitModal(null)}>Cancel</Button>
            <Button loading={submitting} onClick={onUpdateLimit}>Save limit</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!ledgerCustomer}
        onClose={() => setLedgerCustomer(null)}
        title={`Ledger — ${ledgerCustomer?.name}`}
        description={
          ledgerCustomer
            ? `Balance: ${formatCurrency(ledgerCustomer.credit_balance)} · Limit: ${formatCurrency(ledgerCustomer.credit_limit)}`
            : undefined
        }
        size="xl"
      >
        {ledgerLoading ? (
          <LoadingState />
        ) : ledgerTxns.length === 0 ? (
          <EmptyState title="No transactions" description="Credit sales and payments will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-[#ecf1ed] text-left text-[#5c6b63]">
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">Type</th>
                  <th className="pb-2 pr-4 font-medium">Amount</th>
                  <th className="pb-2 pr-4 font-medium">Balance after</th>
                  <th className="pb-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {ledgerTxns.map((txn) => (
                  <tr key={txn.id} className="border-b border-[#f4f6f3]">
                    <td className="py-2 pr-4 text-[#5c6b63]">{formatDate(txn.created_at)}</td>
                    <td className="py-2 pr-4">
                      <Badge variant={txnTypeVariant(txn.transaction_type)}>
                        {txn.transaction_type}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4 font-medium">{formatCurrency(txn.amount)}</td>
                    <td className="py-2 pr-4">{formatCurrency(txn.balance_after)}</td>
                    <td className="py-2 text-[#5c6b63]">{txn.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <Card>
        <CardBody className="p-0">
          {loading ? <LoadingState /> : customers.length === 0 ? (
            <EmptyState title="No customers" description="Add neighborhood customers for udhar tracking." />
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#ecf1ed] text-left text-[#5c6b63]">
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Due</th>
                    <th className="px-4 py-3">Limit</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr
                      key={c.id}
                      className="cursor-pointer border-b border-[#f4f6f3] hover:bg-[#f8faf8]"
                      onClick={() => openLedger(c)}
                    >
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3">{c.phone || "—"}</td>
                      <td className="px-4 py-3 font-semibold text-rose-700">
                        {formatCurrency(c.credit_balance)}
                      </td>
                      <td className="px-4 py-3">{formatCurrency(c.credit_limit)}</td>
                      <td className="px-4 py-3">
                        {Number(c.credit_balance) > 0 ? (
                          <Badge variant="warning">Has due</Badge>
                        ) : (
                          <Badge variant="success">Clear</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="secondary" onClick={() => openLedger(c)}>
                            <History className="h-3.5 w-3.5" />
                            History
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditLimitModal(c);
                              setEditLimitValue(c.credit_limit);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {Number(c.credit_balance) > 0 && (
                            <Button size="sm" onClick={() => setPayModal(c)}>Collect</Button>
                          )}
                        </div>
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
    </div>
  );
}
