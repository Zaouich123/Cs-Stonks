import { z } from "zod";

import { buildItemVariantKey } from "@/modules/catalog/catalog.normalizer";
import type {
  NormalizedLatestPrice,
} from "@/modules/pricing/pricing.types";
import type {
  RawMarketRecord,
  RawPriceProviderItem,
} from "@/modules/providers/provider.types";

const marketRecordSchema = z.object({
  enabled: z.boolean().nullable().optional(),
  name: z.string().trim().min(1),
  priority: z.number().int().nullable().optional(),
  slug: z.string().trim().min(1),
});

const priceRecordSchema = z.object({
  currency: z.string().trim().min(1).nullable().optional(),
  fetchedAt: z.iso.datetime(),
  maxPrice: z.number().nonnegative().nullable().optional(),
  market: marketRecordSchema,
  marketHashName: z.string().trim().min(1),
  meanPrice: z.number().nonnegative().nullable().optional(),
  medianPrice: z.number().nonnegative().nullable().optional(),
  minPrice: z.number().nonnegative().nullable().optional(),
  phase: z.string().trim().min(1).nullable().optional(),
  price: z.number().positive(),
  quantity: z.number().int().nonnegative().nullable().optional(),
  rawPayload: z.record(z.string(), z.unknown()).nullable().optional(),
  sales24hMedian: z.number().nonnegative().nullable().optional(),
  sales24hMin: z.number().nonnegative().nullable().optional(),
  sales24hVolume: z.number().int().nonnegative().nullable().optional(),
  sales30dMedian: z.number().nonnegative().nullable().optional(),
  sales30dMin: z.number().nonnegative().nullable().optional(),
  sales30dVolume: z.number().int().nonnegative().nullable().optional(),
  sales7dMedian: z.number().nonnegative().nullable().optional(),
  sales7dMin: z.number().nonnegative().nullable().optional(),
  sales7dVolume: z.number().int().nonnegative().nullable().optional(),
  sales90dMedian: z.number().nonnegative().nullable().optional(),
  sales90dMin: z.number().nonnegative().nullable().optional(),
  sales90dVolume: z.number().int().nonnegative().nullable().optional(),
  sourceItemUrl: z.string().trim().url().nullable().optional(),
  sourceMarketUrl: z.string().trim().url().nullable().optional(),
  sourceUpdatedAt: z.iso.datetime().nullable().optional(),
  suggestedPrice: z.number().nonnegative().nullable().optional(),
  variantKeyOverride: z.string().trim().min(1).nullable().optional(),
  volume: z.number().int().nonnegative().nullable().optional(),
});

function asNullableString(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function normalizePriceNumber(price: number): number {
  return Math.round(price * 100) / 100;
}

function normalizeNullablePriceNumber(price?: number | null): number | null {
  return typeof price === "number" && Number.isFinite(price) && price >= 0
    ? normalizePriceNumber(price)
    : null;
}

export function normalizeMarketRecord(rawMarket: RawMarketRecord) {
  const market = marketRecordSchema.parse(rawMarket);

  return {
    enabled: market.enabled ?? true,
    name: market.name.trim(),
    priority: market.priority ?? 0,
    slug: market.slug.trim().toLowerCase(),
  };
}

export function normalizeLatestPrice(rawPrice: RawPriceProviderItem): NormalizedLatestPrice {
  const price = priceRecordSchema.parse(rawPrice);
  const marketHashName = price.marketHashName.trim();
  const phase = asNullableString(price.phase);

  return {
    currency: (price.currency ?? "USD").trim().toUpperCase(),
    fetchedAt: new Date(price.fetchedAt),
    maxPrice: normalizeNullablePriceNumber(price.maxPrice),
    market: normalizeMarketRecord(price.market),
    marketHashName,
    meanPrice: normalizeNullablePriceNumber(price.meanPrice),
    medianPrice: normalizeNullablePriceNumber(price.medianPrice),
    minPrice: normalizeNullablePriceNumber(price.minPrice),
    phase,
    price: normalizePriceNumber(price.price),
    quantity: price.quantity ?? null,
    rawPayload: price.rawPayload ?? null,
    sales24hMedian: normalizeNullablePriceNumber(price.sales24hMedian),
    sales24hMin: normalizeNullablePriceNumber(price.sales24hMin),
    sales24hVolume: price.sales24hVolume ?? null,
    sales30dMedian: normalizeNullablePriceNumber(price.sales30dMedian),
    sales30dMin: normalizeNullablePriceNumber(price.sales30dMin),
    sales30dVolume: price.sales30dVolume ?? null,
    sales7dMedian: normalizeNullablePriceNumber(price.sales7dMedian),
    sales7dMin: normalizeNullablePriceNumber(price.sales7dMin),
    sales7dVolume: price.sales7dVolume ?? null,
    sales90dMedian: normalizeNullablePriceNumber(price.sales90dMedian),
    sales90dMin: normalizeNullablePriceNumber(price.sales90dMin),
    sales90dVolume: price.sales90dVolume ?? null,
    sourceItemUrl: asNullableString(price.sourceItemUrl),
    sourceMarketUrl: asNullableString(price.sourceMarketUrl),
    sourceUpdatedAt: price.sourceUpdatedAt ? new Date(price.sourceUpdatedAt) : null,
    suggestedPrice: normalizeNullablePriceNumber(price.suggestedPrice),
    variantKey: asNullableString(price.variantKeyOverride) ?? buildItemVariantKey(marketHashName, phase),
    volume: price.volume ?? null,
  };
}

export function dedupeLatestPrices(prices: NormalizedLatestPrice[]) {
  const map = new Map<string, NormalizedLatestPrice>();

  for (const price of prices) {
    const key = `${price.variantKey}:${price.market.slug}`;
    const existing = map.get(key);

    if (!existing || price.fetchedAt >= existing.fetchedAt) {
      map.set(key, price);
    }
  }

  return [...map.values()];
}

