import type {
  AggregatedCsfloatPriceRecord,
  NormalizedCsfloatListing,
} from "@/modules/providers/csfloat/csfloat.types";

function newestDate(left: Date | null, right: Date | null) {
  if (!left) {
    return right;
  }

  if (!right) {
    return left;
  }

  return left.getTime() > right.getTime() ? left : right;
}

export function aggregateCsfloatListings(
  listings: NormalizedCsfloatListing[],
): AggregatedCsfloatPriceRecord[] {
  const grouped = new Map<string, AggregatedCsfloatPriceRecord>();

  for (const listing of listings) {
    if (!Number.isFinite(listing.price) || listing.price <= 0) {
      continue;
    }

    const current = grouped.get(listing.marketHashName);

    if (!current) {
      grouped.set(listing.marketHashName, {
        currency: "USD",
        fetchedAt: listing.fetchedAt,
        listingIds: [listing.id],
        lowestAsk: listing.price,
        lowestAskCents: listing.priceCents,
        marketHashName: listing.marketHashName,
        quantity: 1,
        rawSample: listing.rawPayload,
        sourceMarketUrl: listing.sourceMarketUrl,
        sourceUpdatedAt: listing.createdAt,
      });
      continue;
    }

    current.quantity += 1;
    current.listingIds.push(listing.id);
    current.fetchedAt =
      listing.fetchedAt.getTime() > current.fetchedAt.getTime()
        ? listing.fetchedAt
        : current.fetchedAt;
    current.sourceUpdatedAt = newestDate(current.sourceUpdatedAt, listing.createdAt);

    if (listing.price < current.lowestAsk) {
      current.lowestAsk = listing.price;
      current.lowestAskCents = listing.priceCents;
      current.rawSample = listing.rawPayload;
      current.sourceMarketUrl = listing.sourceMarketUrl;
    }
  }

  return [...grouped.values()].sort((left, right) =>
    left.marketHashName.localeCompare(right.marketHashName),
  );
}

