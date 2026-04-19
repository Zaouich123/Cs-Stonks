import { cn } from "@/components/ui/Button";
import type { ApiMethod } from "@/lib/api-docs/api-docs-data";

const methodStyles: Record<ApiMethod, string> = {
  DELETE: "border-rose-400/30 bg-rose-500/15 text-rose-200",
  GET: "border-cyan-400/30 bg-cyan-500/15 text-cyan-200",
  PATCH: "border-amber-400/30 bg-amber-500/15 text-amber-100",
  POST: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
  PUT: "border-orange-400/30 bg-orange-500/15 text-orange-100",
};

export function ApiMethodBadge({
  method,
  className,
}: {
  method: ApiMethod;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-8 items-center rounded-full border px-3 text-[11px] font-semibold uppercase tracking-[0.24em]",
        methodStyles[method],
        className,
      )}
    >
      {method}
    </span>
  );
}
