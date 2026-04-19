"use client";

import { cn } from "@/components/ui/Button";
import { ApiMethodBadge } from "@/components/api-docs/ApiMethodBadge";
import type { ApiMethod } from "@/lib/api-docs/api-docs-data";

export function ApiSectionNavItem({
  label,
  active,
  method,
  compact = false,
  onClick,
}: {
  label: string;
  active: boolean;
  method?: ApiMethod;
  compact?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={cn(
        "group flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-3 text-left transition",
        active
          ? "border-[#4da3ff]/35 bg-[#093066]/35 text-white shadow-[0_10px_30px_rgba(9,48,102,0.25)]"
          : "border-transparent bg-white/[0.02] text-white/62 hover:border-white/10 hover:bg-white/[0.05] hover:text-white",
        compact ? "py-2.5" : "",
      )}
      onClick={onClick}
      type="button"
    >
      <span className={cn("text-sm font-medium", compact ? "text-[13px]" : "")}>{label}</span>
      {method ? <ApiMethodBadge className="h-7 px-2.5 text-[10px]" method={method} /> : null}
    </button>
  );
}
