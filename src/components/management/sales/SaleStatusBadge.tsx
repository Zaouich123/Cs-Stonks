"use client";

import { MarketplaceListingStatus } from "@prisma/client";

const styles: Record<MarketplaceListingStatus, string> = {
  ACTIVE: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  CANCELLED: "border-white/12 bg-white/[0.08] text-white/55",
  EXPIRED: "border-orange-400/25 bg-orange-400/10 text-orange-200",
  SOLD: "border-[#4da3ff]/25 bg-[#4da3ff]/10 text-[#9acbff]",
  UNKNOWN: "border-amber-400/25 bg-amber-400/10 text-amber-200",
};

export function SaleStatusBadge({ status }: { status: MarketplaceListingStatus }) {
  return (
    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${styles[status]}`}>
      {status.toLowerCase()}
    </span>
  );
}
