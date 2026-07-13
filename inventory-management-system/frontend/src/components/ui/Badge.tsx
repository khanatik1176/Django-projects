import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  default: "bg-[#ecf1ed] text-[#5c6b63]",
  success: "bg-emerald-50 text-emerald-800",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-rose-50 text-rose-700",
  info: "bg-sky-50 text-sky-800",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof styles;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function statusVariant(status: string) {
  const map: Record<string, keyof typeof styles> = {
    DRAFT: "default",
    SUBMITTED: "info",
    CONFIRMED: "info",
    PARTIALLY_RECEIVED: "warning",
    PARTIALLY_FULFILLED: "warning",
    RECEIVED: "success",
    FULFILLED: "success",
    CANCELLED: "danger",
    PENDING: "warning",
    COMPLETED: "success",
    RECEIPT: "success",
    ISSUE: "warning",
    ADJUSTMENT: "info",
    TRANSFER_IN: "success",
    TRANSFER_OUT: "warning",
    LOW_STOCK: "danger",
    ADEQUATE: "warning",
    GOOD: "success",
    EXPIRING_SOON: "danger",
    OUT_OF_STOCK: "default",
  };
  return map[status] ?? "default";
}

export function stockHealthVariant(status?: string) {
  return statusVariant(status ?? "GOOD");
}

export function stockHealthLabel(status?: string, label?: string) {
  if (label) return label;
  const labels: Record<string, string> = {
    LOW_STOCK: "Low stock",
    ADEQUATE: "Adequate",
    GOOD: "Good",
    EXPIRING_SOON: "Expiring soon",
    OUT_OF_STOCK: "Out of stock",
  };
  return labels[status ?? ""] ?? "Good";
}
