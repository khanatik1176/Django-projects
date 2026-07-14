"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Crown, Gift, Plus } from "lucide-react";
import {
  createLoyaltyOffer,
  createMembership,
  deleteLoyaltyOffer,
  deleteMembership,
  getLoyaltyOffers,
  getMemberships,
  updateLoyaltyOffer,
  updateMembership,
  type LoyaltyOffer,
  type MembershipTier,
} from "@/lib/api/loyalty";
import { PageHeader, LoadingState, EmptyState, Alert } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { useClientPagination } from "@/hooks/useClientPagination";
import { useServerPagination } from "@/hooks/useServerPagination";
import { formatCurrency } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api/client";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";

type Tab = "memberships" | "offers";

interface MembershipForm {
  name: string;
  code: string;
  description?: string;
  discount_percent: string;
  points_per_hundred: string;
  min_points: string;
  credit_limit_bonus: string;
  color: string;
  sort_order: string;
  benefits?: string;
  is_active: string;
}

interface OfferForm {
  title: string;
  description?: string;
  offer_type: LoyaltyOffer["offer_type"];
  value: string;
  points_cost: string;
  membership: string;
  min_points_balance: string;
  is_active: string;
}

const OFFER_TYPES: { value: LoyaltyOffer["offer_type"]; label: string }[] = [
  { value: "PERCENT_OFF", label: "Percent off" },
  { value: "FIXED_OFF", label: "Fixed amount off" },
  { value: "BONUS_POINTS", label: "Bonus points" },
  { value: "FREEBIE", label: "Free item / perk" },
];

function Textarea({
  label,
  id,
  error,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-[#14201a]">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn(
          "w-full rounded-xl border border-[#d8e0d9] bg-white px-3.5 py-2.5 text-sm text-[#14201a] placeholder:text-[#5c6b63]/60 transition-colors focus:border-[#0b6e4f] focus:outline-none focus:ring-2 focus:ring-[#0b6e4f]/15",
          error && "border-rose-400",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

function formatOfferValue(offer: LoyaltyOffer) {
  switch (offer.offer_type) {
    case "PERCENT_OFF":
      return `${offer.value}%`;
    case "FIXED_OFF":
      return formatCurrency(offer.value);
    case "BONUS_POINTS":
      return `${offer.value} pts`;
    case "FREEBIE":
      return offer.value || "—";
    default:
      return offer.value;
  }
}

function offerTypeLabel(type: LoyaltyOffer["offer_type"]) {
  return OFFER_TYPES.find((t) => t.value === type)?.label ?? type;
}

const defaultMembershipValues: MembershipForm = {
  name: "",
  code: "",
  description: "",
  discount_percent: "0",
  points_per_hundred: "1",
  min_points: "0",
  credit_limit_bonus: "0",
  color: "#0b6e4f",
  sort_order: "0",
  benefits: "",
  is_active: "true",
};

const defaultOfferValues: OfferForm = {
  title: "",
  description: "",
  offer_type: "PERCENT_OFF",
  value: "0",
  points_cost: "0",
  membership: "",
  min_points_balance: "0",
  is_active: "true",
};

export default function MembershipsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("memberships");
  const [memberships, setMemberships] = useState<MembershipTier[]>([]);
  const [offers, setOffers] = useState<LoyaltyOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showMembershipForm, setShowMembershipForm] = useState(false);
  const [editingMembership, setEditingMembership] = useState<MembershipTier | null>(null);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState<LoyaltyOffer | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const membershipsPagination = useClientPagination(memberships, 10);
  const {
    setPage: setOffersPage,
    pageSize: offersPageSize,
    onPageSizeChange: onOffersPageSizeChange,
    pagination: offersPagination,
    applyResponse: applyOffersResponse,
    queryParams: offersQueryParams,
  } = useServerPagination(10);

  const membershipForm = useForm<MembershipForm>({ defaultValues: defaultMembershipValues });
  const offerForm = useForm<OfferForm>({ defaultValues: defaultOfferValues });

  useEffect(() => {
    if (user && user.can_manage_config === false) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const loadMemberships = useCallback(async () => {
    try {
      const res = await getMemberships({ page_size: "100", ordering: "sort_order" });
      setMemberships(res.data.results);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  const loadOffers = useCallback(async () => {
    try {
      const res = await getLoyaltyOffers(offersQueryParams);
      setOffers(res.data.results);
      applyOffersResponse(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [offersQueryParams, applyOffersResponse]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "memberships") {
        await loadMemberships();
      } else {
        await loadOffers();
      }
    } finally {
      setLoading(false);
    }
  }, [tab, loadMemberships, loadOffers]);

  useEffect(() => {
    load();
  }, [load]);

  const membershipOptions = [
    { value: "", label: "All members" },
    ...memberships
      .filter((m) => m.is_active)
      .map((m) => ({ value: m.id, label: m.name })),
  ];

  const openCreateMembership = () => {
    setEditingMembership(null);
    membershipForm.reset(defaultMembershipValues);
    setShowMembershipForm(true);
  };

  const openEditMembership = (tier: MembershipTier) => {
    setEditingMembership(tier);
    membershipForm.reset({
      name: tier.name,
      code: tier.code,
      description: tier.description ?? "",
      discount_percent: tier.discount_percent,
      points_per_hundred: tier.points_per_hundred,
      min_points: String(tier.min_points),
      credit_limit_bonus: tier.credit_limit_bonus,
      color: tier.color,
      sort_order: String(tier.sort_order),
      benefits: tier.benefits ?? "",
      is_active: tier.is_active ? "true" : "false",
    });
    setShowMembershipForm(true);
  };

  const onSaveMembership = async (data: MembershipForm) => {
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const payload = {
        name: data.name,
        code: data.code,
        description: data.description,
        discount_percent: data.discount_percent,
        points_per_hundred: data.points_per_hundred,
        min_points: Number(data.min_points),
        credit_limit_bonus: data.credit_limit_bonus,
        color: data.color,
        sort_order: Number(data.sort_order),
        benefits: data.benefits,
        is_active: data.is_active === "true",
      };
      if (editingMembership) {
        await updateMembership(editingMembership.id, payload);
        setSuccess(`${data.name} updated`);
      } else {
        await createMembership(payload);
        setSuccess(`${data.name} created`);
      }
      setShowMembershipForm(false);
      setEditingMembership(null);
      membershipForm.reset(defaultMembershipValues);
      await loadMemberships();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMembership = async (tier: MembershipTier) => {
    if (tier.is_system) {
      setError("Built-in memberships cannot be deleted. Deactivate via Edit instead.");
      return;
    }
    if (!window.confirm(`Delete membership "${tier.name}"?`)) return;
    setError("");
    setSuccess("");
    try {
      await deleteMembership(tier.id);
      setSuccess(`${tier.name} deleted`);
      await loadMemberships();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const openCreateOffer = async () => {
    if (memberships.length === 0) await loadMemberships();
    setEditingOffer(null);
    offerForm.reset(defaultOfferValues);
    setShowOfferForm(true);
  };

  const openEditOffer = async (offer: LoyaltyOffer) => {
    if (memberships.length === 0) await loadMemberships();
    setEditingOffer(offer);
    offerForm.reset({
      title: offer.title,
      description: offer.description ?? "",
      offer_type: offer.offer_type,
      value: offer.value,
      points_cost: String(offer.points_cost),
      membership: offer.membership ? String(offer.membership) : "",
      min_points_balance: String(offer.min_points_balance),
      is_active: offer.is_active ? "true" : "false",
    });
    setShowOfferForm(true);
  };

  const onSaveOffer = async (data: OfferForm) => {
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const payload = {
        title: data.title,
        description: data.description,
        offer_type: data.offer_type,
        value: data.value,
        points_cost: Number(data.points_cost),
        membership: data.membership ? Number(data.membership) : null,
        min_points_balance: Number(data.min_points_balance),
        is_active: data.is_active === "true",
      };
      if (editingOffer) {
        await updateLoyaltyOffer(editingOffer.id, payload);
        setSuccess(`${data.title} updated`);
      } else {
        await createLoyaltyOffer(payload);
        setSuccess(`${data.title} created`);
      }
      setShowOfferForm(false);
      setEditingOffer(null);
      offerForm.reset(defaultOfferValues);
      await loadOffers();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOffer = async (offer: LoyaltyOffer) => {
    if (!window.confirm(`Delete offer "${offer.title}"?`)) return;
    setError("");
    setSuccess("");
    try {
      await deleteLoyaltyOffer(offer.id);
      setSuccess(`${offer.title} deleted`);
      await loadOffers();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (!user?.can_manage_config) {
    return <LoadingState />;
  }

  const activeMembers = memberships.filter((m) => m.is_active).length;
  const activeOffers = offers.filter((o) => o.is_active).length;

  return (
    <div>
      <PageHeader
        title="Memberships"
        description="Loyalty tiers, points rules, and redeemable offers for your customers"
        action={
          tab === "memberships" ? (
            <Button onClick={openCreateMembership}>
              <Plus className="h-4 w-4" />
              Add Tier
            </Button>
          ) : (
            <Button onClick={openCreateOffer}>
              <Plus className="h-4 w-4" />
              Add Offer
            </Button>
          )
        }
      />

      {error && (
        <div className="mb-4">
          <Alert message={error} />
        </div>
      )}
      {success && (
        <div className="mb-4">
          <Alert type="success" message={success} />
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          variant={tab === "memberships" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setTab("memberships")}
        >
          <Crown className="h-4 w-4" />
          Memberships
        </Button>
        <Button
          variant={tab === "offers" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setTab("offers")}
        >
          <Gift className="h-4 w-4" />
          Offers
        </Button>
      </div>

      {tab === "memberships" && (
        <Card className="mb-4 border-[#0b6e4f]/20 bg-[#f0faf5]">
          <CardBody className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-[#0b6e4f]" />
              <div>
                <p className="text-xs text-[#5c6b63]">Active tiers</p>
                <p className="text-2xl font-bold text-[#14201a]">{activeMembers}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-[#5c6b63]">Built-in tiers</p>
              <p className="text-sm font-medium text-[#14201a]">
                Silver · Gold · Loyal · Platinum
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {tab === "offers" && !loading && (
        <Card className="mb-4 border-[#0b6e4f]/20 bg-[#f0faf5]">
          <CardBody className="flex items-center gap-3">
            <Gift className="h-8 w-8 text-[#0b6e4f]" />
            <div>
              <p className="text-xs text-[#5c6b63]">Active offers (this page)</p>
              <p className="text-2xl font-bold text-[#14201a]">{activeOffers}</p>
            </div>
          </CardBody>
        </Card>
      )}

      <Modal
        open={showMembershipForm}
        onClose={() => {
          setShowMembershipForm(false);
          setEditingMembership(null);
        }}
        title={editingMembership ? `Edit ${editingMembership.name}` : "Create membership tier"}
        description={
          editingMembership?.is_system
            ? "Built-in tier — deactivate instead of deleting."
            : "Define discount, points, and udhar bonus for this tier."
        }
      >
        <form
          onSubmit={membershipForm.handleSubmit(onSaveMembership)}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Input label="Name" {...membershipForm.register("name", { required: true })} />
          <Input
            label="Code"
            placeholder="GOLD_PLUS"
            readOnly={!!editingMembership?.is_system}
            className={editingMembership?.is_system ? "bg-[#f8faf8] text-[#5c6b63]" : undefined}
            {...membershipForm.register("code", { required: true })}
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Description"
              rows={2}
              {...membershipForm.register("description")}
            />
          </div>
          <Input
            label="Discount %"
            type="number"
            step="0.01"
            {...membershipForm.register("discount_percent")}
          />
          <Input
            label="Points per ৳100"
            type="number"
            step="0.01"
            {...membershipForm.register("points_per_hundred")}
          />
          <Input
            label="Min points to qualify"
            type="number"
            {...membershipForm.register("min_points")}
          />
          <Input
            label="Credit limit bonus (BDT)"
            type="number"
            step="0.01"
            {...membershipForm.register("credit_limit_bonus")}
          />
          <Input
            label="Color (hex)"
            placeholder="#0b6e4f"
            {...membershipForm.register("color")}
          />
          <Input label="Sort order" type="number" {...membershipForm.register("sort_order")} />
          <div className="sm:col-span-2">
            <Textarea
              label="Benefits"
              rows={3}
              placeholder="One benefit per line for the membership card"
              {...membershipForm.register("benefits")}
            />
          </div>
          <Select
            label="Status"
            options={[
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ]}
            {...membershipForm.register("is_active")}
          />
          <div className="flex justify-end gap-2 border-t border-[#ecf1ed] pt-4 sm:col-span-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowMembershipForm(false);
                setEditingMembership(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingMembership ? "Save changes" : "Create tier"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showOfferForm}
        onClose={() => {
          setShowOfferForm(false);
          setEditingOffer(null);
        }}
        title={editingOffer ? `Edit ${editingOffer.title}` : "Create loyalty offer"}
        description="Redeemable rewards or automatic perks for members."
      >
        <form
          onSubmit={offerForm.handleSubmit(onSaveOffer)}
          className="space-y-4"
        >
          <Input label="Title" {...offerForm.register("title", { required: true })} />
          <Textarea label="Description" rows={2} {...offerForm.register("description")} />
          <Select
            label="Offer type"
            options={OFFER_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            {...offerForm.register("offer_type")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Value"
              type="number"
              step="0.01"
              {...offerForm.register("value")}
            />
            <Input
              label="Points cost"
              type="number"
              {...offerForm.register("points_cost")}
            />
          </div>
          <Select
            label="Membership (optional)"
            options={membershipOptions}
            {...offerForm.register("membership")}
          />
          <Input
            label="Min points balance"
            type="number"
            {...offerForm.register("min_points_balance")}
          />
          <Select
            label="Status"
            options={[
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ]}
            {...offerForm.register("is_active")}
          />
          <div className="flex justify-end gap-2 border-t border-[#ecf1ed] pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowOfferForm(false);
                setEditingOffer(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingOffer ? "Save changes" : "Create offer"}
            </Button>
          </div>
        </form>
      </Modal>

      <Card>
        <CardBody className="p-0">
          {loading ? (
            <LoadingState />
          ) : tab === "memberships" ? (
            memberships.length === 0 ? (
              <EmptyState
                title="No membership tiers"
                description="Create custom tiers or seed Silver, Gold, Loyal, and Platinum."
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px] text-sm">
                    <thead>
                      <tr className="border-b border-[#ecf1ed] text-left text-[#5c6b63]">
                        <th className="px-4 py-3 font-medium">Tier</th>
                        <th className="px-4 py-3 font-medium">Code</th>
                        <th className="px-4 py-3 font-medium">Discount</th>
                        <th className="px-4 py-3 font-medium">Points / ৳100</th>
                        <th className="px-4 py-3 font-medium">Min pts</th>
                        <th className="px-4 py-3 font-medium">Credit bonus</th>
                        <th className="px-4 py-3 font-medium">Color</th>
                        <th className="px-4 py-3 font-medium">Customers</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {membershipsPagination.pagedItems.map((tier) => (
                        <tr
                          key={tier.id}
                          className="border-b border-[#f4f6f3] hover:bg-[#f8faf8]"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-block h-3 w-3 shrink-0 rounded-full border border-[#d8e0d9]"
                                style={{ backgroundColor: tier.color }}
                              />
                              <div>
                                <p className="font-medium text-[#14201a]">{tier.name}</p>
                                {tier.is_system && (
                                  <Badge variant="info" className="mt-1">
                                    System
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-[#5c6b63]">
                            {tier.code}
                          </td>
                          <td className="px-4 py-3">{tier.discount_percent}%</td>
                          <td className="px-4 py-3">{tier.points_per_hundred}</td>
                          <td className="px-4 py-3">{tier.min_points.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            {formatCurrency(tier.credit_limit_bonus)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-2">
                              <span
                                className="inline-block h-6 w-6 cursor-pointer rounded-lg border border-[#d8e0d9]"
                                style={{ backgroundColor: tier.color }}
                                title={tier.color}
                              />
                              <span className="font-mono text-xs text-[#5c6b63]">{tier.color}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3">{tier.customer_count ?? 0}</td>
                          <td className="px-4 py-3">
                            <Badge variant={tier.is_active ? "success" : "default"}>
                              {tier.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="cursor-pointer"
                                onClick={() => openEditMembership(tier)}
                              >
                                Edit
                              </Button>
                              {!tier.is_system && (
                                <Button
                                  size="sm"
                                  variant="danger"
                                  className="cursor-pointer"
                                  onClick={() => handleDeleteMembership(tier)}
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={membershipsPagination.pagination.current_page}
                  totalPages={membershipsPagination.pagination.total_pages}
                  totalCount={membershipsPagination.pagination.count}
                  pageSize={membershipsPagination.pageSize}
                  onPageChange={membershipsPagination.setPage}
                  onPageSizeChange={membershipsPagination.onPageSizeChange}
                />
              </>
            )
          ) : offers.length === 0 ? (
            <EmptyState
              title="No loyalty offers"
              description="Create percent-off, fixed-off, bonus points, or freebie offers."
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b border-[#ecf1ed] text-left text-[#5c6b63]">
                      <th className="px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Value</th>
                      <th className="px-4 py-3 font-medium">Points cost</th>
                      <th className="px-4 py-3 font-medium">Membership</th>
                      <th className="px-4 py-3 font-medium">Min balance</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offers.map((offer) => (
                      <tr
                        key={offer.id}
                        className="border-b border-[#f4f6f3] hover:bg-[#f8faf8]"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#14201a]">{offer.title}</p>
                          {offer.description && (
                            <p className="text-xs text-[#5c6b63]">{offer.description}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge>{offerTypeLabel(offer.offer_type)}</Badge>
                        </td>
                        <td className="px-4 py-3 font-medium">{formatOfferValue(offer)}</td>
                        <td className="px-4 py-3">
                          {offer.points_cost > 0 ? offer.points_cost.toLocaleString() : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {offer.membership_name ?? (
                            <span className="text-[#5c6b63]">All members</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {offer.min_points_balance.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={offer.is_active ? "success" : "default"}>
                            {offer.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="cursor-pointer"
                              onClick={() => openEditOffer(offer)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              className="cursor-pointer"
                              onClick={() => handleDeleteOffer(offer)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={offersPagination.current_page}
                totalPages={offersPagination.total_pages}
                totalCount={offersPagination.count}
                pageSize={offersPageSize}
                onPageChange={setOffersPage}
                onPageSizeChange={onOffersPageSizeChange}
              />
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
