"use client";

import { Clock3 } from "lucide-react";

import type { ManagementTrade } from "@/modules/management/types/management.types";

export function TradeCountdown({ countdown }: { countdown: ManagementTrade["countdown"] }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
        countdown.isEffective
          ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
          : "border-amber-400/25 bg-amber-400/10 text-amber-200"
      }`}
    >
      <Clock3 className="h-3.5 w-3.5" />
      {countdown.label}
    </div>
  );
}
