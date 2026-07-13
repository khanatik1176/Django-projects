import type { User } from "@/lib/types";

/** Admin and manager can update stock list (thresholds, adjust, write-off, top-up). */
export function canUpdateStockList(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.can_manage_config) return true;
  return user.role_code === "ADMIN" || user.role_code === "MANAGER";
}
