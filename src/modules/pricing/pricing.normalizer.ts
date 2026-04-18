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
  market: marketRecordSchema,
  marketHashName: z.string().trim().min(1),
  phase: z.string().trim().min(1).nullable().optional(),
  price: z.number().positive(),
  quantity: z.number().int().nonnegative().nullable().optional(),
  sourceUpdatedAt: z.iso.datetime().nullable().optional(),
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
    market: normalizeMarketRecord(price.market),
    marketHashName,
    phase,
    price: normalizePriceNumber(price.price),
    quantity: price.quantity ?? null,
    sourceUpdatedAt: price.sourceUpdatedAt ? new Date(price.sourceUpdatedAt) : null,
    variantKey: buildItemVariantKey(marketHashName, phase),
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

