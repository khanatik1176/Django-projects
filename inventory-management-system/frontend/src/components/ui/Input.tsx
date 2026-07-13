import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-[#14201a]">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          "w-full rounded-xl border border-[#d8e0d9] bg-white px-3.5 py-2.5 text-sm text-[#14201a] placeholder:text-[#5c6b63]/60 transition-colors focus:border-[#0b6e4f] focus:outline-none focus:ring-2 focus:ring-[#0b6e4f]/15",
          error && "border-rose-400 focus:border-rose-400 focus:ring-rose-400/20",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  ),
);

Input.displayName = "Input";
