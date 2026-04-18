import { ItemType } from "@prisma/client";
import { z } from "zod";

import type { NormalizedCatalogItem } from "@/modules/catalog/catalog.types";
import type { RawCatalogProviderItem } from "@/modules/providers/provider.types";

const catalogItemSchema = z.object({
  baseItemName: z.string().trim().min(1).nullable().optional(),
  collection: z.string().trim().min(1).nullable().optional(),
  displayName: z.string().trim().min(1).nullable().optional(),
  exterior: z.string().trim().min(1).nullable().optional(),
  hasVariants: z.boolean().nullable().optional(),
  imageUrl: z.string().trim().url().nullable().optional(),
  itemType: z.string().trim().min(1),
  lastCatalogSyncAt: z.string().datetime().nullable().optional(),
  marketHashName: z.string().trim().min(1),
  phase: z.string().trim().min(1).nullable().optional(),
  rarity: z.string().trim().min(1).nullable().optional(),
  skinName: z.string().trim().min(1).nullable().optional(),
  source: z.string().trim().min(1).nullable().optional(),
  sourceExternalId: z.string().trim().min(1).nullable().optional(),
  souvenir: z.boolean().nullable().optional(),
  stattrak: z.boolean().nullable().optional(),
  steamAppId: z.number().int().positive().nullable().optional(),
  steamImageUrl: z.string().trim().url().nullable().optional(),
  weapon: z.string().trim().min(1).nullable().optional(),
});

const itemTypeMap: Record<string, ItemType> = {
  agent: ItemType.AGENT,
  capsule: ItemType.CAPSULE,
  case: ItemType.CASE,
  charm: ItemType.CHARM,
  glove: ItemType.GLOVE,
  knife: ItemType.KNIFE,
  graffiti: ItemType.GRAFFITI,
  music_kit: ItemType.MUSIC_KIT,
  other: ItemType.OTHER,
  patch: ItemType.PATCH,
  skin: ItemType.SKIN,
  sticker: ItemType.STICKER,
  tool: ItemType.TOOL,
};

const exteriorPattern = /\(([^)]+)\)\s*$/;
const diacriticPattern = /[\u0300-\u036f]/g;
const nonAlphanumericPattern = /[^a-z0-9]+/g;
const whitespacePattern = /\s+/g;

function asNullableString(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function inferExterior(marketHashName: string, exterior?: string | null): string | null {
  const normalizedExterior = asNullableString(exterior);

  if (normalizedExterior) {
    return normalizedExterior;
  }

  const match = marketHashName.match(exteriorPattern);

  return match?.[1] ?? null;
}

function resolveItemType(itemType: string): ItemType {
  const normalizedType = itemType.trim().toLowerCase();
  const resolvedType = itemTypeMap[normalizedType];

  if (!resolvedType) {
    throw new Error(`Unsupported item type "${itemType}".`);
  }

  return resolvedType;
}

function inferBaseItemName(
  marketHashName: string,
  displayName: string,
  explicitBaseItemName?: string | null,
): string | null {
  const normalizedBaseItemName = asNullableString(explicitBaseItemName);

  if (normalizedBaseItemName) {
    return normalizedBaseItemName;
  }

  const withoutPrefix = marketHashName
    .replace(/^StatTrak(?:\u2122)?\s+/i, "")
    .replace(/^Souvenir\s+/i, "");
  const inferred = withoutPrefix.replace(exteriorPattern, "").trim();

  if (inferred.length === 0 || inferred === displayName) {
    return null;
  }

  return inferred;
}

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(diacriticPattern, "")
    .toLowerCase()
    .replace(nonAlphanumericPattern, " ")
    .replace(whitespacePattern, " ")
    .trim();
}

export function buildItemVariantKey(marketHashName: string, phase?: string | null): string {
  const normalizedPhase = asNullableString(phase);

  return normalizedPhase ? `${marketHashName.trim()}::${normalizedPhase}` : marketHashName.trim();
}

export function buildItemSlug(marketHashName: string, phase?: string | null): string {
  return normalizeSearchText(buildItemVariantKey(marketHashName, phase)).replace(whitespacePattern, "-");
}

export function buildItemSearchText(
  item: Pick<
    NormalizedCatalogItem,
    | "collection"
    | "displayName"
    | "exterior"
    | "itemType"
    | "marketHashName"
    | "phase"
    | "rarity"
    | "skinName"
    | "souvenir"
    | "stattrak"
    | "weapon"
  >,
): string {
  const parts = [
    item.displayName,
    item.marketHashName,
    item.weapon,
    item.skinName,
    item.exterior,
    item.rarity,
    item.collection,
    item.phase,
    item.itemType,
    item.stattrak ? "stattrak" : null,
    item.souvenir ? "souvenir" : null,
  ].filter((value): value is string => Boolean(value));

  return normalizeSearchText(parts.join(" "));
}

export function normalizeCatalogItem(rawItem: RawCatalogProviderItem): NormalizedCatalogItem {
  const item = catalogItemSchema.parse(rawItem);
  const marketHashName = item.marketHashName.trim();
  const phase = asNullableString(item.phase);
  const displayName = asNullableString(item.displayName) ?? marketHashName;
  const itemType = resolveItemType(item.itemType);
  const exterior = inferExterior(marketHashName, item.exterior);
  const stattrak = item.stattrak ?? marketHashName.includes("StatTrak");
  const souvenir = item.souvenir ?? marketHashName.includes("Souvenir");
  const baseItemName = inferBaseItemName(marketHashName, displayName, item.baseItemName);
  const hasVariants =
    item.hasVariants ?? Boolean(exterior || stattrak || souvenir || phase || baseItemName);
  const normalizedItem = {
    baseItemName,
    collection: asNullableString(item.collection),
    displayName,
    exterior,
    hasVariants,
    imageUrl: asNullableString(item.imageUrl),
    isActive: true,
    itemType,
    lastCatalogSyncAt: item.lastCatalogSyncAt ? new Date(item.lastCatalogSyncAt) : new Date(),
    marketHashName,
    phase,
    rarity: asNullableString(item.rarity),
    skinName: asNullableString(item.skinName),
    slug: buildItemSlug(marketHashName, phase),
    source: asNullableString(item.source) ?? "unknown",
    sourceExternalId: asNullableString(item.sourceExternalId),
    souvenir,
    stattrak,
    steamAppId: item.steamAppId ?? 730,
    steamImageUrl: asNullableString(item.steamImageUrl),
    variantKey: buildItemVariantKey(marketHashName, phase),
    weapon: asNullableString(item.weapon),
  };

  return {
    ...normalizedItem,
    searchText: buildItemSearchText(normalizedItem),
  };
}
