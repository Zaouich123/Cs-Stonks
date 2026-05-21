"use client";

import { UserTradeStatus } from "@prisma/client";

const styles: Record<UserTradeStatus, string> = {
  ACCEPTED: "border-[#4da3ff]/25 bg-[#4da3ff]/10 text-[#9acbff]",
  CANCELLED: "border-white/12 bg-white/[0.08] text-white/55",
  DECLINED: "border-rose-400/25 bg-rose-400/10 text-rose-200",
  EFFECTIVE: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  EXPIRED: "border-orange-400/25 bg-orange-400/10 text-orange-200",
  PENDING: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  UNKNOWN: "border-white/12 bg-white/[0.08] text-white/55",
};

export function TradeStatusBadge({ status }: { status: UserTradeStatus }) {
  return (
    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${styles[status]}`}>
      {status.toLowerCase()}
    </span>
  );
}
