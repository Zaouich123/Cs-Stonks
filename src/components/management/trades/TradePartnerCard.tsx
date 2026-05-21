"use client";

import type { ManagementTrade } from "@/modules/management/types/management.types";

export function TradePartnerCard({ trade }: { trade: ManagementTrade }) {
  return (
    <div className="flex items-center gap-3">
      {trade.partnerAvatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={trade.partnerName}
          className="h-10 w-10 rounded-xl border border-white/10 object-cover"
          src={trade.partnerAvatarUrl}
        />
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-sm font-bold uppercase">
          {trade.partnerName.slice(0, 1)}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">{trade.partnerName}</p>
        <p className="truncate text-xs text-white/38">
          {trade.partnerSteamId ?? "Steam partner"}
        </p>
      </div>
    </div>
  );
}
