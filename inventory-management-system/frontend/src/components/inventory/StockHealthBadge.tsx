"use client";

import { Badge, stockHealthLabel, stockHealthVariant } from "@/components/ui/Badge";
import type { StockHealthStatus } from "@/lib/types";

export function StockHealthBadge({
  status,
  label,
  daysToExpiry,
}: {
  status?: StockHealthStatus | string;
  label?: string;
  daysToExpiry?: number | null;
}) {
  const text = stockHealthLabel(status, label);
  const suffix =
    status === "EXPIRING_SOON" && daysToExpiry != null
      ? ` · ${daysToExpiry}d`
      : "";

  return (
    <Badge variant={stockHealthVariant(status)}>
      {text}
      {suffix}
    </Badge>
  );
}
