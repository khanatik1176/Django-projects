"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Wallet } from "lucide-react";
import { collectPayment, createCustomer, getCustomers, type Customer } from "@/lib/api/customers";
import { PageHeader, LoadingState, EmptyState, Alert } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { useServerPagination } from "@/hooks/useServerPagination";
import { formatCurrency } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api/client";

interface CustomerForm {
  name: string;
  phone?: string;
  address?: string;
  credit_limit: string;
}

export default function UdharPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [payModal, setPayModal] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState("");
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
      await collectPayment(payModal.id, payAmount, "Counter collection");
      setSuccess(`Received ${formatCurrency(payAmount)} from ${payModal.name}`);
      setPayModal(null);
      setPayAmount("");
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
        title="উধার Khata"
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

      <Modal open={!!payModal} onClose={() => setPayModal(null)} title={`Collect payment — ${payModal?.name}`}>
        <div className="space-y-4">
          <p className="text-sm text-[#5c6b63]">
            Outstanding: <strong>{formatCurrency(payModal?.credit_balance ?? 0)}</strong>
          </p>
          <Input label="Amount received" type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setPayModal(null)}>Cancel</Button>
            <Button loading={submitting} onClick={onCollect}>Record payment</Button>
          </div>
        </div>
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
                    <tr key={c.id} className="border-b border-[#f4f6f3]">
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
                        {Number(c.credit_balance) > 0 && (
                          <Button size="sm" onClick={() => setPayModal(c)}>Collect</Button>
                        )}
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
