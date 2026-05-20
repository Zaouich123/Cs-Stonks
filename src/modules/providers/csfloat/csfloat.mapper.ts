import type {
  AggregatedCsfloatPriceRecord,
  CsfloatListing,
  CsfloatPriceListRecord,
  NormalizedCsfloatListing,
} from "@/modules/providers/csfloat/csfloat.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function readDate(value: unknown): Date | null {
  const raw = readString(value);

  if (!raw) {
    return null;
  }

  const date = new Date(raw);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function buildCsfloatSearchUrl(marketHashName: string) {
  const searchParams = new URLSearchParams({
    market_hash_name: marketHashName,
    sort_by: "lowest_price",
  });

  return `https://csfloat.com/search?${searchParams.toString()}`;
}

export function normalizeCsfloatListing(
  listing: CsfloatListing,
  fetchedAt = new Date(),
): NormalizedCsfloatListing | null {
  if (!isRecord(listing)) {
    return null;
  }

  const item = isRecord(listing.item) ? listing.item : null;
  const marketHashName = readString(item?.market_hash_name);
  const priceCents = readNumber(listing.price);

  if (!marketHashName || priceCents === null || priceCents <= 0) {
    return null;
  }

  const id = readString(listing.id) ?? `${marketHashName}:${priceCents}:${fetchedAt.toISOString()}`;

  return {
    assetId: readString(item?.asset_id),
    createdAt: readDate(listing.created_at),
    fetchedAt,
    floatValue: readNumber(item?.float_value),
    iconUrl: readString(item?.icon_url),
    id,
    inspectLink: readString(item?.inspect_link),
    isSouvenir: readBoolean(item?.is_souvenir),
    isStatTrak: readBoolean(item?.is_stattrak),
    marketHashName,
    paintIndex: readNumber(item?.paint_index),
    paintSeed: readNumber(item?.paint_seed),
    price: Number((priceCents / 100).toFixed(2)),
    priceCents,
    rawPayload: listing as Record<string, unknown>,
    sourceMarketUrl: buildCsfloatSearchUrl(marketHashName),
    wearName: readString(item?.wear_name),
  };
}

export function mapCsfloatPriceListRecordToAggregated(
  record: CsfloatPriceListRecord,
  fetchedAt = new Date(),
): AggregatedCsfloatPriceRecord | null {
  const marketHashName = readString(record.market_hash_name);
  const minPriceCents = readNumber(record.min_price);

  if (!marketHashName || minPriceCents === null || minPriceCents <= 0) {
    return null;
  }

  const quantity = readNumber(record.quantity);

  return {
    currency: "USD",
    fetchedAt,
    listingIds: [],
    lowestAsk: Number((minPriceCents / 100).toFixed(2)),
    lowestAskCents: minPriceCents,
    marketHashName,
    quantity: quantity !== null && quantity > 0 ? Math.floor(quantity) : 0,
    rawSample: record as Record<string, unknown>,
    sourceMarketUrl: buildCsfloatSearchUrl(marketHashName),
    sourceUpdatedAt: null,
  };
}
