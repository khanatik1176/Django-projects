"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Award, History, Pencil, Plus, Sparkles, Star, Wallet } from "lucide-react";
import {
  collectPayment,
  createCustomer,
  getCustomerTransactions,
  getCustomers,
  updateCustomer,
  type CreditTransaction,
  type Customer,
} from "@/lib/api/customers";
import {
  assignMembership,
  adjustPoints,
  getMemberships,
  getPointsLedger,
  type MembershipTier,
  type PointsLedgerEntry,
} from "@/lib/api/loyalty";
import { PageHeader, LoadingState, EmptyState, Alert } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { useServerPagination } from "@/hooks/useServerPagination";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
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

function pointsEntryVariant(type: string) {
  if (type === "EARN" || type === "BONUS" || type === "UPGRADE") return "success" as const;
  if (type === "REDEEM") return "warning" as const;
  if (type === "ADJUST") return "info" as const;
  return "default" as const;
}

function MembershipBadge({ customer }: { customer: Customer }) {
  if (!customer.membership_name) return null;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold text-white"
      style={{ backgroundColor: customer.membership_color || "#0b6e4f" }}
    >
      {customer.membership_name}
    </span>
  );
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
  const [membershipModal, setMembershipModal] = useState<Customer | null>(null);
  const [memberships, setMemberships] = useState<MembershipTier[]>([]);
  const [membershipsLoading, setMembershipsLoading] = useState(false);
  const [selectedMembershipId, setSelectedMembershipId] = useState("");
  const [pointsModal, setPointsModal] = useState<Customer | null>(null);
  const [pointsAmount, setPointsAmount] = useState("");
  const [pointsNotes, setPointsNotes] = useState("");
  const [pointsHistoryCustomer, setPointsHistoryCustomer] = useState<Customer | null>(null);
  const [pointsLedger, setPointsLedger] = useState<PointsLedgerEntry[]>([]);
  const [pointsLedgerLoading, setPointsLedgerLoading] = useState(false);
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

  const openMembershipModal = async (customer: Customer) => {
    setMembershipModal(customer);
    setSelectedMembershipId(customer.membership ? String(customer.membership) : "");
    setMembershipsLoading(true);
    try {
      const res = await getMemberships({ is_active: "true", page_size: "50" });
      setMemberships(res.data.results);
    } catch (err) {
      setError(getErrorMessage(err));
      setMembershipModal(null);
    } finally {
      setMembershipsLoading(false);
    }
  };

  const openPointsHistory = async (customer: Customer) => {
    setPointsHistoryCustomer(customer);
    setPointsLedger([]);
    setPointsLedgerLoading(true);
    try {
      const res = await getPointsLedger(customer.id);
      setPointsLedger(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
      setPointsHistoryCustomer(null);
    } finally {
      setPointsLedgerLoading(false);
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

  const onAssignMembership = async () => {
    if (!membershipModal) return;
    setSubmitting(true);
    try {
      const membershipId = selectedMembershipId ? Number(selectedMembershipId) : null;
      await assignMembership(membershipModal.id, membershipId);
      setSuccess(
        membershipId
          ? `Membership assigned to ${membershipModal.name}`
          : `Membership removed from ${membershipModal.name}`,
      );
      setMembershipModal(null);
      setSelectedMembershipId("");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onAdjustPoints = async () => {
    if (!pointsModal || !pointsAmount) return;
    setSubmitting(true);
    try {
      await adjustPoints(pointsModal.id, Number(pointsAmount), pointsNotes || undefined);
      setSuccess(`Points adjusted for ${pointsModal.name}`);
      setPointsModal(null);
      setPointsAmount("");
      setPointsNotes("");
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
            {editLimitModal?.effective_credit_limit &&
              editLimitModal.effective_credit_limit !== editLimitModal.credit_limit && (
                <span className="ml-2 text-[#0b6e4f]">
                  (effective {formatCurrency(editLimitModal.effective_credit_limit)})
                </span>
              )}
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
        open={!!membershipModal}
        onClose={() => setMembershipModal(null)}
        title={`Assign membership — ${membershipModal?.name}`}
      >
        <div className="space-y-4">
          {membershipModal?.membership_name && (
            <p className="text-sm text-[#5c6b63]">
              Current: <MembershipBadge customer={membershipModal} />
            </p>
          )}
          <Select
            label="Membership tier"
            value={selectedMembershipId}
            onChange={(e) => setSelectedMembershipId(e.target.value)}
            disabled={membershipsLoading}
            options={[
              { value: "", label: membershipsLoading ? "Loading…" : "No membership" },
              ...memberships.map((m) => ({
                value: m.id,
                label: `${m.name} (${m.discount_percent}% off · ${formatNumber(m.points_per_hundred)} pts/৳100)`,
              })),
            ]}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setMembershipModal(null)}>Cancel</Button>
            <Button loading={submitting} onClick={onAssignMembership}>Save</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!pointsModal}
        onClose={() => {
          setPointsModal(null);
          setPointsAmount("");
          setPointsNotes("");
        }}
        title={`Adjust points — ${pointsModal?.name}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-[#5c6b63]">
            Current balance:{" "}
            <strong>{formatNumber(pointsModal?.loyalty_points ?? 0)} pts</strong>
          </p>
          <Input
            label="Points adjustment (+ add / − deduct)"
            type="number"
            value={pointsAmount}
            onChange={(e) => setPointsAmount(e.target.value)}
            placeholder="e.g. 50 or -20"
          />
          <Input
            label="Notes (optional)"
            value={pointsNotes}
            onChange={(e) => setPointsNotes(e.target.value)}
            placeholder="Reason for adjustment"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setPointsModal(null);
                setPointsAmount("");
                setPointsNotes("");
              }}
            >
              Cancel
            </Button>
            <Button loading={submitting} onClick={onAdjustPoints}>Adjust</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!ledgerCustomer}
        onClose={() => setLedgerCustomer(null)}
        title={`Credit ledger — ${ledgerCustomer?.name}`}
        description={
          ledgerCustomer
            ? `Balance: ${formatCurrency(ledgerCustomer.credit_balance)} · Limit: ${formatCurrency(
                ledgerCustomer.effective_credit_limit ?? ledgerCustomer.credit_limit,
              )}`
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

      <Modal
        open={!!pointsHistoryCustomer}
        onClose={() => setPointsHistoryCustomer(null)}
        title={`Points history — ${pointsHistoryCustomer?.name}`}
        description={
          pointsHistoryCustomer
            ? `Balance: ${formatNumber(pointsHistoryCustomer.loyalty_points ?? 0)} pts · Lifetime: ${formatNumber(pointsHistoryCustomer.lifetime_points ?? 0)} pts`
            : undefined
        }
        size="xl"
      >
        {pointsLedgerLoading ? (
          <LoadingState />
        ) : pointsLedger.length === 0 ? (
          <EmptyState title="No points activity" description="Earnings, redemptions, and adjustments will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-[#ecf1ed] text-left text-[#5c6b63]">
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">Type</th>
                  <th className="pb-2 pr-4 font-medium">Points</th>
                  <th className="pb-2 pr-4 font-medium">Balance after</th>
                  <th className="pb-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {pointsLedger.map((entry) => (
                  <tr key={entry.id} className="border-b border-[#f4f6f3]">
                    <td className="py-2 pr-4 text-[#5c6b63]">{formatDate(entry.created_at)}</td>
                    <td className="py-2 pr-4">
                      <Badge variant={pointsEntryVariant(entry.entry_type)}>
                        {entry.entry_type}
                      </Badge>
                    </td>
                    <td className={`py-2 pr-4 font-medium ${entry.points >= 0 ? "text-[#0b6e4f]" : "text-rose-700"}`}>
                      {entry.points >= 0 ? "+" : ""}{formatNumber(entry.points)}
                    </td>
                    <td className="py-2 pr-4">{formatNumber(entry.balance_after)}</td>
                    <td className="py-2 text-[#5c6b63]">
                      {entry.offer_title ? `${entry.offer_title} — ` : ""}
                      {entry.notes || "—"}
                    </td>
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
                    <th className="px-4 py-3">Points</th>
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
                      <td className="px-4 py-3">
                        <p className="font-medium">{c.name}</p>
                        {c.membership_name && (
                          <div className="mt-1">
                            <MembershipBadge customer={c} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">{c.phone || "—"}</td>
                      <td className="px-4 py-3 font-semibold text-rose-700">
                        {formatCurrency(c.credit_balance)}
                      </td>
                      <td className="px-4 py-3">
                        {c.effective_credit_limit &&
                        c.effective_credit_limit !== c.credit_limit ? (
                          <div>
                            <p>{formatCurrency(c.effective_credit_limit)}</p>
                            <p className="text-xs text-[#5c6b63]">
                              base {formatCurrency(c.credit_limit)}
                            </p>
                          </div>
                        ) : (
                          formatCurrency(c.credit_limit)
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-[#0b6e4f]">
                          {formatNumber(c.loyalty_points ?? 0)}
                        </span>
                      </td>
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
                            Credit
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => openPointsHistory(c)}>
                            <Star className="h-3.5 w-3.5" />
                            Points
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openMembershipModal(c)}>
                            <Award className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setPointsModal(c);
                              setPointsAmount("");
                              setPointsNotes("");
                            }}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
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
