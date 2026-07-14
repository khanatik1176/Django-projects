"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Boxes,
  History,
  ShoppingCart,
  Truck,
  Settings,
  X,
  ScanLine,
  ArrowLeftRight,
  Percent,
  BarChart3,
  Wallet,
  Banknote,
  ScrollText,
  Receipt,
  Crown,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos", label: "Counter POS", icon: ScanLine, highlight: true },
  { href: "/invoices", label: "Invoice Bank", icon: Receipt },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/products", label: "Products", icon: Package },
  { href: "/warehouses", label: "Warehouses", icon: Warehouse },
  { href: "/stock", label: "Stock", icon: Boxes },
  { href: "/clearance", label: "Clearance", icon: Percent },
  { href: "/transfers", label: "Transfers", icon: ArrowLeftRight },
  { href: "/movements", label: "Movements", icon: History },
  { href: "/purchase-orders", label: "Purchase Orders", icon: ShoppingCart },
  { href: "/sales-orders", label: "Sales Orders", icon: Truck },
  { href: "/udhar", label: "Hal Khata", icon: Wallet },
  { href: "/memberships", label: "Memberships", icon: Crown },
  { href: "/finance", label: "Finance", icon: Banknote },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/activity-logs", label: "Activity Logs", icon: ScrollText },
];

export function Sidebar({
  open,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  const content = (
    <>
      <div className="flex items-center justify-between border-b border-[#ecf1ed] px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0b6e4f] text-sm font-bold text-white">
            ভ
          </span>
          <div>
            <p className="font-display text-lg leading-none text-[#14201a]">Bhandar</p>
            <p className="mt-0.5 text-[11px] text-[#5c6b63]">Inventory OS</p>
          </div>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#5c6b63] hover:bg-[#ecf1ed] lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {nav.map(({ href, label, icon: Icon, highlight }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[#e6f4ee] text-[#085340]"
                  : highlight
                    ? "text-[#0b6e4f] hover:bg-[#e6f4ee]/60"
                    : "text-[#5c6b63] hover:bg-[#ecf1ed] hover:text-[#14201a]",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.85} />
              {label}
            </Link>
          );
        })}
        {user?.can_manage_config && (
          <Link
            href="/configuration"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === "/configuration"
                ? "bg-[#e6f4ee] text-[#085340]"
                : "text-[#5c6b63] hover:bg-[#ecf1ed] hover:text-[#14201a]",
            )}
          >
            <Settings className="h-4 w-4 shrink-0" strokeWidth={1.85} />
            Configuration
          </Link>
        )}
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop — fixed full viewport height */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden h-dvh w-64 min-h-0 flex-col bg-white border-r border-[#d8e0d9] lg:flex">
        {content}
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-[#14201a]/40 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(18rem,88vw)] flex-col bg-white shadow-xl transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {content}
      </aside>
    </>
  );
}
