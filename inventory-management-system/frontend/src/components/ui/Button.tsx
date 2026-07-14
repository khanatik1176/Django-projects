"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variants = {
  primary:
    "bg-[#0b6e4f] text-white shadow-sm hover:bg-[#085340] hover:shadow-md disabled:bg-[#0b6e4f]/50",
  secondary:
    "bg-white text-[#14201a] border border-[#d8e0d9] shadow-sm hover:bg-[#ecf1ed] hover:border-[#0b6e4f]/35",
  ghost: "bg-transparent text-[#5c6b63] hover:bg-[#ecf1ed] hover:text-[#14201a]",
  danger: "bg-rose-600 text-white shadow-sm hover:bg-rose-500 hover:shadow-md",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      children,
      disabled,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6e4f]/35 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      )}
      {children}
    </button>
  ),
);

Button.displayName = "Button";
