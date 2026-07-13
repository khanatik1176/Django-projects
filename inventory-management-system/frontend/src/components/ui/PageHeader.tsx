import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-2xl tracking-tight text-[#14201a] sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm text-[#5c6b63]">{description}</p>
        )}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-[#5c6b63]">
      <span className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#d8e0d9] border-t-[#0b6e4f]" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="px-4 py-16 text-center">
      <p className="text-sm font-semibold text-[#14201a]">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-sm text-[#5c6b63]">
          {description}
        </p>
      )}
    </div>
  );
}

export function Alert({
  type = "error",
  message,
}: {
  type?: "error" | "success";
  message: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl px-4 py-3 text-sm",
        type === "error"
          ? "border border-rose-200 bg-rose-50 text-rose-700"
          : "border border-emerald-200 bg-emerald-50 text-emerald-800",
      )}
    >
      {message}
    </div>
  );
}
