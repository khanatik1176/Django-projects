import { formatNumber } from "@/lib/utils";
import type { Stock } from "@/lib/types";

export function StockQuantityCell({ stock }: { stock: Stock }) {
  return (
    <div className="space-y-0.5 text-sm">
      <p>
        <span className="text-[#5c6b63]">On hand: </span>
        <span className="font-medium text-[#14201a]">{formatNumber(stock.quantity)}</span>
      </p>
      <p>
        <span className="text-[#5c6b63]">Available: </span>
        <span className="font-medium text-[#14201a]">
          {formatNumber(stock.available_quantity)}
        </span>
      </p>
      {stock.is_expiring_soon && stock.expiring_quantity && (
        <p className="text-xs text-rose-600">
          Expiring: {formatNumber(stock.expiring_quantity)}
        </p>
      )}
    </div>
  );
}
