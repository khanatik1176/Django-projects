"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { getSalesOrder } from "@/lib/api/orders";
import { PageHeader, LoadingState, Alert } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { InvoiceDocument } from "@/components/invoices/InvoiceDocument";
import type { SalesOrder } from "@/lib/types";
import { getErrorMessage } from "@/lib/api/client";

function InvoiceDetailContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const autoPrint = searchParams.get("print") === "1";
  const id = Number(params.id);

  const [invoice, setInvoice] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getSalesOrder(id)
      .then((res) => setInvoice(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!autoPrint || !invoice) return;
    const timer = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(timer);
  }, [autoPrint, invoice]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="print:hidden">
        <PageHeader
          title={invoice ? `Invoice ${invoice.invoice_number || invoice.so_number}` : "Invoice"}
          description="POS sale receipt — print or return to Invoice Bank"
          action={
            <div className="flex flex-wrap gap-2">
              <Link href="/invoices">
                <Button variant="secondary">
                  <ArrowLeft className="h-4 w-4" />
                  Invoice Bank
                </Button>
              </Link>
              <Button onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
          }
        />
      </div>

      {error && (
        <div className="print:hidden">
          <Alert message={error} />
        </div>
      )}

      {invoice && <InvoiceDocument invoice={invoice} />}
    </div>
  );
}

export default function InvoiceDetailPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <InvoiceDetailContent />
    </Suspense>
  );
}
