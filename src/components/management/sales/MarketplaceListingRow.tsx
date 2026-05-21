"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { usePreferences } from "@/components/preferences/PreferencesProvider";
import type { ManagementMarketplaceListing } from "@/modules/management/types/management.types";
import { SaleStatusBadge } from "@/components/management/sales/SaleStatusBadge";

export function MarketplaceListingRow({ listing }: { listing: ManagementMarketplaceListing }) {
  const { formatMoney } = usePreferences();

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
      <div className="flex min-w-0 items-center gap-3">
        {listing.item.imageUrl ?? listing.item.steamImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={listing.item.displayName}
            className="h-12 w-12 rounded-xl object-contain"
            src={listing.item.imageUrl ?? listing.item.steamImageUrl ?? ""}
          />
        ) : (
          <span className="h-12 w-12 rounded-xl bg-white/[0.05]" />
        )}
        <div className="min-w-0">
          <Link
            className="block truncate text-sm font-semibold text-white transition hover:text-[#9acbff]"
            href={`/market/${listing.item.id}`}
          >
            {listing.item.displayName}
          </Link>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/35">{listing.marketSlug}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-white">
            {formatMoney(listing.listedPrice, listing.currency)}
          </p>
          <p className="text-xs text-white/35">
            {listing.lastCheckedAt
              ? new Date(listing.lastCheckedAt).toLocaleDateString()
              : "not checked"}
          </p>
        </div>
        <SaleStatusBadge status={listing.status} />
        {listing.listingUrl ? (
          <a
            aria-label="Open listing"
            className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/55 transition hover:text-white"
            href={listing.listingUrl}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : null}
      </div>
    </div>
  );
}
