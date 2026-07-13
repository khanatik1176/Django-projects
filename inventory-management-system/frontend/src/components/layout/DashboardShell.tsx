"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { useAuth } from "@/providers/AuthProvider";
import { LoadingState } from "@/components/ui/PageHeader";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f4f6f3]">
        <LoadingState />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-dvh bg-[#f4f6f3] lg:pl-64">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex min-h-dvh min-w-0 flex-col">
        <TopHeader onMenuOpen={() => setMenuOpen(true)} />

        <main className="flex-1 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full px-3 py-4 sm:px-4 sm:py-5 lg:px-5"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
