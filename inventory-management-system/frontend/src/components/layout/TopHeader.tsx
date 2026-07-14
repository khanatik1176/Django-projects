"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, Menu, UserRound } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { mediaUrl } from "@/lib/utils";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/products": "Products",
  "/warehouses": "Warehouses",
  "/stock": "Stock",
  "/clearance": "Clearance",
  "/udhar": "Hal Khata",
  "/movements": "Movements",
  "/purchase-orders": "Purchase Orders",
  "/sales-orders": "Sales Orders",
  "/configuration": "Configuration",
  "/profile": "Profile",
};

function getTitle(pathname: string) {
  if (titles[pathname]) return titles[pathname];
  const match = Object.keys(titles).find(
    (key) => key !== "/dashboard" && pathname.startsWith(key),
  );
  return match ? titles[match] : "Bhandar";
}

export function TopHeader({ onMenuOpen }: { onMenuOpen: () => void }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const initials =
    `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase() ||
    "U";

  const avatarSrc = mediaUrl(user?.profile_picture);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-[#d8e0d9] bg-white/90 px-3 backdrop-blur-md sm:h-16 sm:px-4 lg:px-5">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onMenuOpen}
          className="rounded-xl border border-[#d8e0d9] bg-white p-2 text-[#14201a] lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#14201a] sm:text-base">
            {getTitle(pathname)}
          </p>
          <p className="hidden truncate text-xs text-[#5c6b63] sm:block">
            Bhandar inventory operations
          </p>
        </div>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-[#d8e0d9] bg-white py-1 pl-1 pr-2.5 transition hover:bg-[#f4f6f3] sm:pr-3"
          aria-expanded={open}
          aria-haspopup="menu"
        >
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarSrc}
              alt=""
              className="h-8 w-8 rounded-full object-cover sm:h-9 sm:w-9"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0b6e4f] text-xs font-bold text-white sm:h-9 sm:w-9">
              {initials}
            </span>
          )}
          <span className="hidden max-w-[9rem] truncate text-left text-sm font-medium text-[#14201a] md:block">
            {user?.first_name} {user?.last_name}
          </span>
          <ChevronDown className="hidden h-4 w-4 text-[#5c6b63] sm:block" />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-[#d8e0d9] bg-white py-1 shadow-lg"
          >
            <div className="border-b border-[#ecf1ed] px-3 py-2.5">
              <p className="truncate text-sm font-semibold text-[#14201a]">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="truncate text-xs text-[#5c6b63]">{user?.email}</p>
            </div>
            <Link
              href="/profile"
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-[#14201a] hover:bg-[#f4f6f3]"
              onClick={() => setOpen(false)}
            >
              <UserRound className="h-4 w-4 text-[#5c6b63]" />
              View profile
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-rose-700 hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
