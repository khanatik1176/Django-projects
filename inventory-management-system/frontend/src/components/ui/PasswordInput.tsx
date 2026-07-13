"use client";

import { Eye, EyeOff } from "lucide-react";
import { InputHTMLAttributes, forwardRef, useState } from "react";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-[#14201a]">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={visible ? "text" : "password"}
            className={cn(
              "w-full rounded-xl border border-[#d8e0d9] bg-white py-2.5 pl-3.5 pr-10 text-sm text-[#14201a] placeholder:text-[#5c6b63]/60 transition-colors focus:border-[#0b6e4f] focus:outline-none focus:ring-2 focus:ring-[#0b6e4f]/15",
              error && "border-rose-400 focus:border-rose-400 focus:ring-rose-400/20",
              className,
            )}
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible((current) => !current)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-[#5c6b63] transition-colors hover:text-[#14201a]"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";
