"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Barcode, CreditCard, FileText, Printer, ShoppingBag, Trash2 } from "lucide-react";
import { getProductByBarcode, getProduct, getProducts } from "@/lib/api/products";
import { getStock, getWarehouses } from "@/lib/api/inventory";
import { getCustomers } from "@/lib/api/customers";
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
import { formatCurrency } from "@/lib/utils";
import type { Product, SalesOrder, Warehouse } from "@/lib/types";
import type { Customer } from "@/lib/api/customers";
import { getErrorMessage } from "@/lib/api/client";

interface CartLine {
  product: Product;
  quantity: number;
  unitPriceOverride?: string | null;
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastInvoice, setLastInvoice] = useState<SalesOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [availability, setAvailability] = useState<Record<number, string>>({});
  const [bootstrapping, setBootstrapping] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const total = useMemo(
    () => cart.reduce((sum, line) => sum + line.quantity * lineUnitPrice(line), 0),
    [cart],
  );

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
    setSubmitting(true);
    try {
      const res = await posCheckout({
        warehouse_id: Number(warehouseId),
        payment_method: payment,
        customer_id: payment === "CREDIT" ? Number(customerId) : null,
        items: cart.map((l) => ({
          product_id: l.product.id,
          quantity: l.quantity,
          unit_price: String(lineUnitPrice(l)),
        })),
      });
      const invoice = invoiceFromPosCheckout(res.data);
      setLastInvoice(invoice);
      setSuccess(`Invoice ${res.data.invoice_number || res.data.so_number} · ${formatCurrency(res.data.total)}`);
      setCart([]);
      setBarcode("");
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
        onClose={() => setLastInvoice(null)}
        title={`Invoice ${lastInvoice?.invoice_number || lastInvoice?.so_number || ""}`}
        description="Sale completed — print the bill or open it in Invoice Bank"
        size="xl"
      >
        {lastInvoice && (
          <div className="space-y-4">
            <InvoiceDocument invoice={lastInvoice} compact />
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={() => setLastInvoice(null)}>
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
            <p className="text-3xl font-bold text-[#14201a]">{formatCurrency(total)}</p>

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

            {payment === "CREDIT" && (
              <Select
                label="Udhar customer"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                options={[
                  { value: "", label: "Select customer..." },
                  ...customers.map((c) => ({
                    value: c.id,
                    label: `${c.name} (due ${formatCurrency(c.credit_balance)})`,
                  })),
                ]}
              />
            )}

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
