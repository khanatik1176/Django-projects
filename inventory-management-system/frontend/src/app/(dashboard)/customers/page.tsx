"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Ban,
  CheckCircle2,
  Pencil,
  Plus,
  Search,
  Crown,
} from "lucide-react";
import {
  banCustomer,
  createCustomer,
  getCustomers,
  unbanCustomer,
  updateCustomer,
  type Customer,
} from "@/lib/api/customers";
import {
  assignMembership,
  getMemberships,
  type MembershipTier,
} from "@/lib/api/loyalty";
import { PageHeader, LoadingState, EmptyState, Alert } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api/client";

interface CustomerForm {
  name: string;
  phone?: string;
  address?: string;
  credit_limit: string;
  notes?: string;
  membership?: string;
}

function MembershipBadge({ customer }: { customer: Customer }) {
  if (!customer.membership_name) {
    return <span className="text-xs text-[#5c6b63]">No membership</span>;
  }
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
      style={{ backgroundColor: customer.membership_color || "#0b6e4f" }}
    >
      {customer.membership_name}
    </span>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [memberships, setMemberships] = useState<MembershipTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pagination, setPagination] = useState({
    count: 0,
    total_pages: 1,
    current_page: 1,
  });

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [membershipModal, setMembershipModal] = useState<Customer | null>(null);
  const [selectedMembershipId, setSelectedMembershipId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CustomerForm>({
    defaultValues: { credit_limit: "5000", membership: "" },
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {
        page: String(page),
        page_size: String(pageSize),
        ordering: "name",
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter === "active") params.is_active = "true";
      if (statusFilter === "banned") params.is_active = "false";

      const res = await getCustomers(params);
      setCustomers(res.data.results);
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
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    getMemberships({ page_size: "50", is_active: "true" })
      .then((res) => setMemberships(res.data.results))
      .catch(() => undefined);
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.reset({ name: "", phone: "", address: "", credit_limit: "5000", notes: "", membership: "" });
    setShowForm(true);
  };

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    form.reset({
      name: customer.name,
      phone: customer.phone || "",
      address: customer.address || "",
      credit_limit: customer.credit_limit,
      notes: customer.notes || "",
      membership: customer.membership ? String(customer.membership) : "",
    });
    setShowForm(true);
  };

  const onSubmit = async (data: CustomerForm) => {
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        name: data.name,
        phone: data.phone || "",
        address: data.address || "",
        credit_limit: data.credit_limit,
        notes: data.notes || "",
      };

      if (editing) {
        await updateCustomer(editing.id, payload);
        if (data.membership !== String(editing.membership || "")) {
          await assignMembership(
            editing.id,
            data.membership ? Number(data.membership) : null,
          );
        }
        setSuccess(`Updated ${data.name}`);
      } else {
        const created = await createCustomer(payload);
        if (data.membership && created.data?.id) {
          await assignMembership(created.data.id, Number(data.membership));
        }
        setSuccess(`Created ${data.name}`);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBanToggle = async (customer: Customer) => {
    const action = customer.is_active ? "ban" : "unban";
    if (!window.confirm(`${action === "ban" ? "Ban" : "Unban"} ${customer.name}?`)) return;
    setError("");
    try {
      if (customer.is_active) await banCustomer(customer.id);
      else await unbanCustomer(customer.id);
      setSuccess(
        customer.is_active
          ? `${customer.name} banned`
          : `${customer.name} unbanned`,
      );
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const openMembership = (customer: Customer) => {
    setMembershipModal(customer);
    setSelectedMembershipId(customer.membership ? String(customer.membership) : "");
  };

  const saveMembership = async () => {
    if (!membershipModal) return;
    setSubmitting(true);
    setError("");
    try {
      await assignMembership(
        membershipModal.id,
        selectedMembershipId ? Number(selectedMembershipId) : null,
      );
      setSuccess(`Membership updated for ${membershipModal.name}`);
      setMembershipModal(null);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const membershipOptions = [
    { value: "", label: "No membership" },
    ...memberships.map((m) => ({
      value: String(m.id),
      label: `${m.name} · ${m.discount_percent}% off`,
    })),
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Customers"
        description="Manage shop customers, memberships, and ban status"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add customer
          </Button>
        }
      />

      {error && <Alert message={error} />}
      {success && <Alert type="success" message={success} />}

      <Card>
        <CardHeader>
          <form
            className="flex flex-col gap-3 lg:flex-row lg:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              void load();
            }}
          >
            <div className="flex-1">
              <Input
                label="Search"
                placeholder="Name, phone, address…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full lg:w-48">
              <Select
                label="Status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "", label: "All" },
                  { value: "active", label: "Active" },
                  { value: "banned", label: "Banned" },
                ]}
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
          ) : customers.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No customers"
                description="Add a customer to start tracking memberships and udhar."
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-sm">
                  <thead>
                    <tr className="border-b border-[#ecf1ed] bg-[#f7f9f7] text-left text-[#5c6b63]">
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium">Membership</th>
                      <th className="px-4 py-3 font-medium">Points</th>
                      <th className="px-4 py-3 font-medium">Udhar</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="border-b border-[#ecf1ed] transition hover:bg-[#f7f9f7]"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#14201a]">{customer.name}</p>
                          <p className="text-xs text-[#5c6b63]">
                            {customer.phone || "No phone"}
                            {customer.address ? ` · ${customer.address}` : ""}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <MembershipBadge customer={customer} />
                          {customer.membership_discount_percent ? (
                            <p className="mt-1 text-xs text-[#5c6b63]">
                              {customer.membership_discount_percent}% POS discount
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-[#0b6e4f]">
                            {formatNumber(customer.loyalty_points ?? 0)}
                          </p>
                          <p className="text-xs text-[#5c6b63]">
                            Lifetime {formatNumber(customer.lifetime_points ?? 0)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">
                            {formatCurrency(customer.credit_balance)}
                          </p>
                          <p className="text-xs text-[#5c6b63]">
                            Limit{" "}
                            {formatCurrency(
                              customer.effective_credit_limit || customer.credit_limit,
                            )}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={customer.is_active ? "success" : "danger"}>
                            {customer.is_active ? "Active" : "Banned"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            <Button size="sm" variant="secondary" onClick={() => openEdit(customer)}>
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => openMembership(customer)}
                            >
                              <Crown className="h-3.5 w-3.5" />
                              Membership
                            </Button>
                            <Button
                              size="sm"
                              variant={customer.is_active ? "danger" : "secondary"}
                              onClick={() => void handleBanToggle(customer)}
                            >
                              {customer.is_active ? (
                                <>
                                  <Ban className="h-3.5 w-3.5" />
                                  Ban
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Unban
                                </>
                              )}
                            </Button>
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

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? "Edit customer" : "Add customer"}
        description="Update contact details, credit limit, and membership."
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Name"
            {...form.register("name", { required: "Required" })}
            error={form.formState.errors.name?.message}
          />
          <Input label="Phone" placeholder="01XXXXXXXXX" {...form.register("phone")} />
          <Input label="Address" className="sm:col-span-2" {...form.register("address")} />
          <Input
            label="Credit limit (৳)"
            type="number"
            step="0.01"
            {...form.register("credit_limit", { required: true })}
          />
          <Select
            label="Membership"
            options={membershipOptions}
            {...form.register("membership")}
          />
          <Input label="Notes" className="sm:col-span-2" {...form.register("notes")} />
          <div className="flex justify-end gap-2 border-t border-[#ecf1ed] pt-4 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editing ? "Save changes" : "Create customer"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!membershipModal}
        onClose={() => setMembershipModal(null)}
        title="Set membership"
        description={
          membershipModal
            ? `${membershipModal.name} · ${membershipModal.loyalty_points ?? 0} points`
            : undefined
        }
      >
        <div className="space-y-4">
          <Select
            label="Membership tier"
            value={selectedMembershipId}
            onChange={(e) => setSelectedMembershipId(e.target.value)}
            options={membershipOptions}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setMembershipModal(null)}>
              Cancel
            </Button>
            <Button type="button" loading={submitting} onClick={() => void saveMembership()}>
              Save membership
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
