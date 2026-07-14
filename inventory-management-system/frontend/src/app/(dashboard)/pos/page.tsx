"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Barcode, CreditCard, FileText, Printer, ShoppingBag, Trash2 } from "lucide-react";
import { getProductByBarcode, getProduct, getProducts } from "@/lib/api/products";
import { getStock, getWarehouses } from "@/lib/api/inventory";
import { getCustomers, getCustomerByPhone } from "@/lib/api/customers";
import { getLoyaltyOffers } from "@/lib/api/loyalty";
import { posCheckout } from "@/lib/api/extras";
import { PageHeader, Alert, LoadingState } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import {
  InvoiceDocument,
  invoiceFromPosCheckout,
} from "@/components/invoices/InvoiceDocument";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Product, SalesOrder, Warehouse } from "@/lib/types";
import type { Customer } from "@/lib/api/customers";
import type { LoyaltyOffer } from "@/lib/api/loyalty";
import { getErrorMessage } from "@/lib/api/client";

interface CartLine {
  product: Product;
  quantity: number;
  unitPriceOverride?: string | null;
}

interface CheckoutSummary {
  subtotal?: string;
  membership_discount?: string;
  offer_discount?: string;
  points_earned?: number;
}

const payments = [
  { id: "CASH", label: "নগদ Cash" },
  { id: "BKASH", label: "bKash" },
  { id: "NAGAD", label: "Nagad" },
  { id: "CREDIT", label: "উধার Udhar" },
] as const;

function lineUnitPrice(line: CartLine): number {
  return Number(line.unitPriceOverride ?? line.product.selling_price ?? 0);
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function applyDiscount(subtotal: number, percent: number): { discount: number; after: number } {
  if (percent <= 0) return { discount: 0, after: subtotal };
  const discount = roundMoney((subtotal * percent) / 100);
  return { discount, after: Math.max(0, roundMoney(subtotal - discount)) };
}

function offerDiscountPreview(offer: LoyaltyOffer, afterMembership: number): number {
  const value = Number(offer.value || 0);
  if (offer.offer_type === "PERCENT_OFF") {
    return roundMoney((afterMembership * value) / 100);
  }
  if (offer.offer_type === "FIXED_OFF") {
    return roundMoney(Math.min(afterMembership, value));
  }
  return 0;
}

function offerLabel(offer: LoyaltyOffer): string {
  const cost =
    offer.points_cost > 0 ? ` · ${formatNumber(offer.points_cost)} pts` : "";
  if (offer.offer_type === "PERCENT_OFF") {
    return `${offer.title} (${offer.value}% off${cost})`;
  }
  if (offer.offer_type === "FIXED_OFF") {
    return `${offer.title} (${formatCurrency(offer.value)} off${cost})`;
  }
  if (offer.offer_type === "BONUS_POINTS") {
    return `${offer.title} (+${formatNumber(offer.value)} bonus pts${cost})`;
  }
  return `${offer.title}${cost}`;
}

function MembershipBadge({ customer }: { customer: Customer }) {
  if (!customer.membership_name) return null;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
      style={{ backgroundColor: customer.membership_color || "#0b6e4f" }}
    >
      {customer.membership_name}
    </span>
  );
}

function CheckoutSummaryLines({ summary }: { summary: CheckoutSummary }) {
  const hasDiscounts =
    Number(summary.membership_discount || 0) > 0 ||
    Number(summary.offer_discount || 0) > 0 ||
    (summary.points_earned ?? 0) > 0;

  if (!hasDiscounts && !summary.subtotal) return null;

  return (
    <div className="rounded-xl border border-[#ecf1ed] bg-[#f8faf8] px-3 py-2 text-sm space-y-1">
      {summary.subtotal && (
        <div className="flex justify-between text-[#5c6b63]">
          <span>Subtotal</span>
          <span>{formatCurrency(summary.subtotal)}</span>
        </div>
      )}
      {Number(summary.membership_discount || 0) > 0 && (
        <div className="flex justify-between text-[#0b6e4f]">
          <span>Membership discount</span>
          <span>−{formatCurrency(summary.membership_discount)}</span>
        </div>
      )}
      {Number(summary.offer_discount || 0) > 0 && (
        <div className="flex justify-between text-[#0b6e4f]">
          <span>Offer discount</span>
          <span>−{formatCurrency(summary.offer_discount)}</span>
        </div>
      )}
      {(summary.points_earned ?? 0) > 0 && (
        <div className="flex justify-between font-medium text-[#14201a]">
          <span>Points earned</span>
          <span>+{formatNumber(summary.points_earned)} pts</span>
        </div>
      )}
    </div>
  );
}

function POSContent() {
  const searchParams = useSearchParams();
  const urlProcessed = useRef(false);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [payment, setPayment] = useState<string>("CASH");
  const [customerId, setCustomerId] = useState("");
  const [phoneLookup, setPhoneLookup] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [memberProfile, setMemberProfile] = useState<Customer | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState("");
  const [loyaltyOffers, setLoyaltyOffers] = useState<LoyaltyOffer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [checkoutSummary, setCheckoutSummary] = useState<CheckoutSummary | null>(null);
  const [lastInvoice, setLastInvoice] = useState<SalesOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [availability, setAvailability] = useState<Record<number, string>>({});
  const [bootstrapping, setBootstrapping] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCustomer = useMemo(() => {
    if (memberProfile && String(memberProfile.id) === customerId) return memberProfile;
    return customers.find((c) => String(c.id) === customerId) ?? null;
  }, [customers, customerId, memberProfile]);

  const applyCustomer = useCallback((customer: Customer) => {
    setCustomers((prev) => {
      const exists = prev.some((c) => c.id === customer.id);
      if (exists) {
        return prev.map((c) => (c.id === customer.id ? customer : c));
      }
      return [customer, ...prev];
    });
    setCustomerId(String(customer.id));
    setMemberProfile(customer);
    setPhoneLookup(customer.phone || "");
  }, []);

  const lookupByPhone = async () => {
    const phone = phoneLookup.trim();
    if (!phone) {
      setError("Enter a customer phone number.");
      return;
    }
    setLookingUp(true);
    setError("");
    setSuccess("");
    try {
      const res = await getCustomerByPhone(phone);
      applyCustomer(res.data);
      setSuccess(
        res.data.membership_name
          ? `Loaded ${res.data.name} · ${res.data.membership_name}`
          : `Loaded ${res.data.name}`,
      );
    } catch (err) {
      setError(getErrorMessage(err));
      setMemberProfile(null);
      setCustomerId("");
    } finally {
      setLookingUp(false);
    }
  };

  useEffect(() => {
    Promise.all([
      getWarehouses({ page_size: "50" }),
      getCustomers({ page_size: "100" }),
    ]).then(([w, c]) => {
      setWarehouses(w.data.results);
      setCustomers(c.data.results);
      const def = w.data.results.find((x) => x.is_default) ?? w.data.results[0];
      if (def) setWarehouseId(String(def.id));
    }).finally(() => setBootstrapping(false));
  }, []);

  useEffect(() => {
    setSelectedOfferId("");
    if (!selectedCustomer?.membership) {
      setLoyaltyOffers([]);
      return;
    }

    let cancelled = false;
    setOffersLoading(true);

    getLoyaltyOffers({
      for_membership: String(selectedCustomer.membership),
      active_only: "true",
      page_size: "50",
    })
      .then((res) => {
        if (!cancelled) setLoyaltyOffers(res.data.results);
      })
      .catch(() => {
        if (!cancelled) setLoyaltyOffers([]);
      })
      .finally(() => {
        if (!cancelled) setOffersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCustomer?.membership, selectedCustomer?.id]);

  const addProductToCart = useCallback(
    (product: Product, qty = 1, unitPriceOverride?: string | null) => {
      setCart((prev) => {
        const existing = prev.find((l) => l.product.id === product.id);
        if (existing) {
          return prev.map((l) =>
            l.product.id === product.id
              ? {
                  ...l,
                  quantity: l.quantity + qty,
                  unitPriceOverride:
                    unitPriceOverride !== undefined ? unitPriceOverride : l.unitPriceOverride,
                }
              : l,
          );
        }
        return [
          ...prev,
          {
            product,
            quantity: Math.max(1, qty),
            unitPriceOverride: unitPriceOverride ?? null,
          },
        ];
      });
    },
    [],
  );

  useEffect(() => {
    if (bootstrapping || urlProcessed.current) return;

    const productId = searchParams.get("product");
    if (!productId) return;

    urlProcessed.current = true;

    const warehouseParam = searchParams.get("warehouse");
    const unitPrice = searchParams.get("unit_price");
    const qtyParam = searchParams.get("qty");
    const qty = Math.max(1, Number(qtyParam) || 1);

    if (warehouseParam) setWarehouseId(warehouseParam);

    getProduct(Number(productId))
      .then((res) => {
        addProductToCart(res.data, qty, unitPrice);
        setSuccess(
          unitPrice
            ? `Clearance item added — ${formatCurrency(unitPrice)}`
            : `${res.data.name} added to cart`,
        );
        inputRef.current?.focus();
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, [bootstrapping, searchParams, addProductToCart]);

  const cartProductIds = useMemo(
    () => cart.map((l) => l.product.id).join(","),
    [cart],
  );

  useEffect(() => {
    if (!warehouseId || cart.length === 0) {
      setAvailability({});
      return;
    }

    let cancelled = false;

    Promise.all(
      cart.map((line) =>
        getStock({
          product: String(line.product.id),
          warehouse: warehouseId,
          page_size: "1",
        }).then((res) => ({
          productId: line.product.id,
          available: res.data.results[0]?.available_quantity ?? "0",
        })),
      ),
    )
      .then((results) => {
        if (cancelled) return;
        setAvailability(
          Object.fromEntries(results.map((r) => [r.productId, r.available])),
        );
      })
      .catch(() => {
        if (!cancelled) setAvailability({});
      });

    return () => {
      cancelled = true;
    };
  }, [warehouseId, cartProductIds, cart.length]);

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.quantity * lineUnitPrice(line), 0),
    [cart],
  );

  const membershipPercent = Number(selectedCustomer?.membership_discount_percent || 0);

  const { discount: membershipDiscount, after: afterMembership } = useMemo(
    () => applyDiscount(subtotal, membershipPercent),
    [subtotal, membershipPercent],
  );

  const selectedOffer = useMemo(
    () => loyaltyOffers.find((o) => String(o.id) === selectedOfferId) ?? null,
    [loyaltyOffers, selectedOfferId],
  );

  const offerDiscount = useMemo(
    () => (selectedOffer ? offerDiscountPreview(selectedOffer, afterMembership) : 0),
    [selectedOffer, afterMembership],
  );

  const payable = useMemo(
    () => Math.max(0, roundMoney(afterMembership - offerDiscount)),
    [afterMembership, offerDiscount],
  );

  const estimatedPoints = useMemo(() => {
    if (!selectedCustomer?.membership) return 0;
    const rate = Number(selectedCustomer.membership_points_per_hundred || 0);
    if (rate <= 0 || payable <= 0) return 0;
    return Math.floor((payable / 100) * rate);
  }, [selectedCustomer, payable]);

  const eligibleOffers = useMemo(() => {
    const points = selectedCustomer?.loyalty_points ?? 0;
    return loyaltyOffers.filter(
      (o) =>
        points >= o.min_points_balance &&
        (o.points_cost <= 0 || points >= o.points_cost),
    );
  }, [loyaltyOffers, selectedCustomer?.loyalty_points]);

  const addProduct = useCallback(async (code: string) => {
    setError("");
    const trimmed = code.trim();
    if (!trimmed) return;

    try {
      let product: Product;
      try {
        const res = await getProductByBarcode(trimmed);
        product = res.data;
      } catch {
        const search = await getProducts({ search: trimmed, page_size: "5" });
        const match =
          search.data.results.find((p) => p.sku === trimmed) ??
          search.data.results[0];
        if (!match) throw new Error("Product not found");
        product = match;
      }

      addProductToCart(product, 1);
      setBarcode("");
      inputRef.current?.focus();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [addProductToCart]);

  const checkout = async () => {
    if (!warehouseId || cart.length === 0) return;
    setError("");
    setSuccess("");
    setCheckoutSummary(null);
    setSubmitting(true);
    try {
      const res = await posCheckout({
        warehouse_id: Number(warehouseId),
        payment_method: payment,
        customer_id: customerId ? Number(customerId) : null,
        redeem_offer_id: selectedOfferId ? Number(selectedOfferId) : null,
        items: cart.map((l) => ({
          product_id: l.product.id,
          quantity: l.quantity,
          unit_price: String(lineUnitPrice(l)),
        })),
      });
      const invoice = invoiceFromPosCheckout(res.data);
      const summary: CheckoutSummary = {
        subtotal: res.data.subtotal,
        membership_discount: res.data.membership_discount,
        offer_discount: res.data.offer_discount,
        points_earned: res.data.points_earned,
      };
      setCheckoutSummary(summary);
      setLastInvoice(invoice);

      const parts = [
        `Invoice ${res.data.invoice_number || res.data.so_number}`,
        formatCurrency(res.data.total),
      ];
      if (Number(summary.membership_discount || 0) > 0) {
        parts.push(`member −${formatCurrency(summary.membership_discount)}`);
      }
      if (Number(summary.offer_discount || 0) > 0) {
        parts.push(`offer −${formatCurrency(summary.offer_discount)}`);
      }
      if ((summary.points_earned ?? 0) > 0) {
        parts.push(`+${formatNumber(summary.points_earned)} pts`);
      }
      setSuccess(parts.join(" · "));

      setCart([]);
      setBarcode("");
      setSelectedOfferId("");
      inputRef.current?.focus();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (bootstrapping) return <LoadingState />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Counter POS"
        description="Barcode scan checkout — cash, bKash, Nagad, or উধার credit"
        action={
          <Link href="/invoices">
            <Button variant="secondary">
              <FileText className="h-4 w-4" />
              Invoice Bank
            </Button>
          </Link>
        }
      />

      {error && <Alert message={error} />}
      {success && <Alert type="success" message={success} />}

      <Modal
        open={!!lastInvoice}
        onClose={() => {
          setLastInvoice(null);
          setCheckoutSummary(null);
        }}
        title={`Invoice ${lastInvoice?.invoice_number || lastInvoice?.so_number || ""}`}
        description="Sale completed — print the bill or open it in Invoice Bank"
        size="xl"
      >
        {lastInvoice && (
          <div className="space-y-4">
            {checkoutSummary && <CheckoutSummaryLines summary={checkoutSummary} />}
            <InvoiceDocument invoice={lastInvoice} compact />
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setLastInvoice(null);
                  setCheckoutSummary(null);
                }}
              >
                New sale
              </Button>
              <Link href={`/invoices/${lastInvoice.id}`}>
                <Button variant="secondary">
                  <FileText className="h-4 w-4" />
                  Open in bank
                </Button>
              </Link>
              <Link href={`/invoices/${lastInvoice.id}?print=1`} target="_blank">
                <Button>
                  <Printer className="h-4 w-4" />
                  Print invoice
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Modal>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Card>
            <CardBody className="space-y-4">
              <Select
                label="Shop counter / warehouse"
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
              />
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addProduct(barcode);
                }}
                className="flex gap-2"
              >
                <Input
                  ref={inputRef}
                  label="Scan barcode or type SKU"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="8941001001007"
                  className="flex-1"
                />
                <Button type="submit" className="mt-6">
                  <Barcode className="h-4 w-4" />
                  Add
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-0">
              {cart.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-[#5c6b63]">
                  Scan a product to start the sale
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#ecf1ed] text-left text-[#5c6b63]">
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3">Available</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Line</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((line) => {
                      const unitPrice = lineUnitPrice(line);
                      const sellingPrice = Number(line.product.selling_price || 0);
                      const isClearance =
                        line.unitPriceOverride != null &&
                        Number(line.unitPriceOverride) !== sellingPrice;
                      const available = Number(availability[line.product.id] ?? 0);
                      const exceedsStock = line.quantity > available;
                      const isPerishable = line.product.is_perishable;

                      return (
                        <tr key={line.product.id} className="border-b border-[#f4f6f3]">
                          <td className="px-4 py-3">
                            <p className="font-medium">{line.product.name}</p>
                            <p className="text-xs text-[#5c6b63]">{line.product.sku}</p>
                            {isPerishable && (
                              <p className="mt-1 text-xs font-medium text-amber-600">
                                Sold FEFO — oldest expiry first
                              </p>
                            )}
                            {exceedsStock && (
                              <p className="mt-1 text-xs font-medium text-amber-600">
                                Qty exceeds available ({available} on hand)
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min={1}
                              className="w-16 rounded border border-[#d8e0d9] px-2 py-1"
                              value={line.quantity}
                              onChange={(e) => {
                                const qty = Math.max(1, Number(e.target.value) || 1);
                                setCart((prev) =>
                                  prev.map((l) =>
                                    l.product.id === line.product.id ? { ...l, quantity: qty } : l,
                                  ),
                                );
                              }}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className={exceedsStock ? "font-medium text-amber-600" : ""}>
                              {availability[line.product.id] != null
                                ? available
                                : "…"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {isClearance ? (
                              <div>
                                <p className="font-medium text-[#0b6e4f]">
                                  {formatCurrency(unitPrice)}
                                </p>
                                <p className="text-xs text-[#5c6b63] line-through">
                                  {formatCurrency(sellingPrice)}
                                </p>
                                <p className="text-xs font-medium text-amber-600">Clearance</p>
                              </div>
                            ) : (
                              formatCurrency(unitPrice)
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {formatCurrency(line.quantity * unitPrice)}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() =>
                                setCart((prev) =>
                                  prev.filter((l) => l.product.id !== line.product.id),
                                )
                              }
                              className="cursor-pointer text-rose-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
        </div>

        <Card className="lg:col-span-2 h-fit">
          <CardBody className="space-y-4">
            <div className="flex items-center gap-2 text-[#0b6e4f]">
              <ShoppingBag className="h-5 w-5" />
              <h2 className="font-semibold text-[#14201a]">Checkout</h2>
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#5c6b63]">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {membershipDiscount > 0 && (
                <div className="flex justify-between text-[#0b6e4f]">
                  <span>Membership ({membershipPercent}%)</span>
                  <span>−{formatCurrency(membershipDiscount)}</span>
                </div>
              )}
              {offerDiscount > 0 && (
                <div className="flex justify-between text-[#0b6e4f]">
                  <span>Offer discount</span>
                  <span>−{formatCurrency(offerDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[#ecf1ed] pt-2 text-lg font-bold text-[#14201a]">
                <span>Payable</span>
                <span>{formatCurrency(payable)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#14201a]">
                Customer phone
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="01XXXXXXXXX"
                  value={phoneLookup}
                  onChange={(e) => setPhoneLookup(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void lookupByPhone();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  loading={lookingUp}
                  onClick={() => void lookupByPhone()}
                  className="shrink-0"
                >
                  Lookup
                </Button>
              </div>
              <p className="text-xs text-[#5c6b63]">
                Enter phone to load membership, points, discounts & udhar balance.
              </p>
            </div>

            <Select
              label={payment === "CREDIT" ? "Udhar customer (required)" : "Customer (optional)"}
              value={customerId}
              onChange={(e) => {
                const next = e.target.value;
                setCustomerId(next);
                if (!next) {
                  setMemberProfile(null);
                  setPhoneLookup("");
                  return;
                }
                const found = customers.find((c) => String(c.id) === next);
                if (found) {
                  setMemberProfile(found);
                  setPhoneLookup(found.phone || "");
                }
              }}
              options={[
                { value: "", label: "Walk-in / no customer" },
                ...customers.map((c) => ({
                  value: c.id,
                  label: `${c.name}${c.phone ? ` · ${c.phone}` : ""}${
                    c.membership_name ? ` · ${c.membership_name}` : ""
                  }${
                    payment === "CREDIT" ? ` (due ${formatCurrency(c.credit_balance)})` : ""
                  }`,
                })),
              ]}
            />

            {selectedCustomer && (
              <div className="rounded-xl border border-[#ecf1ed] bg-[#f8faf8] p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#14201a]">{selectedCustomer.name}</p>
                    <p className="text-xs text-[#5c6b63]">
                      {selectedCustomer.phone || "No phone"}
                      {selectedCustomer.address ? ` · ${selectedCustomer.address}` : ""}
                    </p>
                  </div>
                  <MembershipBadge customer={selectedCustomer} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-[#5c6b63]">
                  <div>
                    Membership discount
                    <p className="font-semibold text-[#0b6e4f]">
                      {membershipPercent > 0 ? `${membershipPercent}%` : "—"}
                    </p>
                  </div>
                  <div>
                    Points balance
                    <p className="font-semibold text-[#14201a]">
                      {formatNumber(selectedCustomer.loyalty_points ?? 0)}
                    </p>
                  </div>
                  <div>
                    Lifetime points
                    <p className="font-semibold text-[#14201a]">
                      {formatNumber(selectedCustomer.lifetime_points ?? 0)}
                    </p>
                  </div>
                  <div>
                    Udhar due
                    <p className="font-semibold text-[#14201a]">
                      {formatCurrency(selectedCustomer.credit_balance)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    Credit limit
                    <p className="font-semibold text-[#14201a]">
                      {formatCurrency(
                        selectedCustomer.effective_credit_limit ||
                          selectedCustomer.credit_limit,
                      )}
                    </p>
                  </div>
                  {estimatedPoints > 0 && (
                    <div className="col-span-2 text-[#0b6e4f]">
                      This sale earns ~{formatNumber(estimatedPoints)} pts
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedCustomer?.membership && (
              <Select
                label="Redeem loyalty offer"
                value={selectedOfferId}
                onChange={(e) => setSelectedOfferId(e.target.value)}
                disabled={offersLoading}
                options={[
                  { value: "", label: offersLoading ? "Loading offers…" : "No offer" },
                  ...eligibleOffers.map((o) => ({
                    value: o.id,
                    label: offerLabel(o),
                  })),
                ]}
              />
            )}

            <div className="grid grid-cols-2 gap-2">
              {payments.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPayment(p.id)}
                  className={`cursor-pointer rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                    payment === p.id
                      ? "border-[#0b6e4f] bg-[#e6f4ee] text-[#085340]"
                      : "border-[#ecf1ed] text-[#5c6b63]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <Button
              className="w-full"
              size="lg"
              loading={submitting}
              disabled={!cart.length || !warehouseId || (payment === "CREDIT" && !customerId)}
              onClick={checkout}
            >
              <CreditCard className="h-4 w-4" />
              Complete sale
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default function POSPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <POSContent />
    </Suspense>
  );
}
