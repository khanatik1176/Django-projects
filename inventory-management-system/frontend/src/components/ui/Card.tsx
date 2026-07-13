import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-[#d8e0d9]/90 bg-white shadow-[0_1px_2px_rgba(20,32,26,0.04)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border-b border-[#ecf1ed] px-4 py-4 sm:px-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-4 py-4 sm:px-6", className)} {...props}>
      {children}
    </div>
  );
}
